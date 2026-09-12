# app.py — Flask API + static frontend for PostgreSQL on Render

from flask import Flask, request, jsonify, send_from_directory
import psycopg2
import psycopg2.extras
import json
import os
from flask_cors import CORS
import logging

# --- Logging (so Render shows errors) ---
logging.basicConfig(level=logging.DEBUG)


# --- Flask setup ---
app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Database connection helper ---
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            dbname=os.getenv("DB_NAME"),
            sslmode="require"  # Render requires SSL
        )
        return conn
    except Exception as e:
        print("❌ Database connection failed:", e)
        raise


# --- POST: receive and store player scores ---
@app.route("/api/submit_score", methods=["POST", "OPTIONS"])
def submit_score():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight ok"}), 200

    if request.content_type != "application/json":
        return jsonify({"error": "Content-Type must be application/json"}), 415

    try:
        data = request.get_json(force=True)
    except Exception as e:
        print("❌ JSON parse error:", e)
        return jsonify({"error": "Malformed JSON"}), 400

    # Required main fields
    player = data.get("player")
    score = data.get("score")
    threshold = data.get("threshold")

    if not all([player, score, threshold]):
        print("❌ Missing field:", data)
        return jsonify({"error": "Missing required fields"}), 400

    # Bonuses + detailed score data
    face_value_bonus = data.get("face_value_bonus", {})
    lower_section_bonus = data.get("lower_section_bonus", {})
    face_swap_bonus = data.get("face_swap_bonus", [])
    upper_row_points = data.get("upper_row_points", {})
    lower_row_points = data.get("lower_row_points", {})

    print(f"📥 Received score from {player}: {score} (threshold {threshold})")

    # Insert into PostgreSQL
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO scores (
                player, score, threshold,
                face_value_bonus, lower_section_bonus, face_swap_bonus,
                upper_row_points, lower_row_points
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            player, score, threshold,
            json.dumps(face_value_bonus),
            json.dumps(lower_section_bonus),
            json.dumps(face_swap_bonus),
            json.dumps(upper_row_points),
            json.dumps(lower_row_points)
        ))

        conn.commit()
        cur.close()
        conn.close()

        print("✅ Score inserted successfully into PostgreSQL.")

    except Exception as err:
        print("❌ Database error:", err)
        return jsonify({"error": str(err)}), 500

    return jsonify({"status": "ok"}), 201


# --- GET: retrieve recent scores ---
@app.route("/api/scores", methods=["GET"])
def get_scores():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("SELECT * FROM scores ORDER BY created_at DESC LIMIT 20")
        rows = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify(rows)
    except Exception as err:
        print("❌ Database error:", err)
        return jsonify({"error": str(err)}), 500


# --- Test DB route (helpful for debugging Render) ---
@app.route("/api/test_db")
def test_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return {"ok": True, "time": str(result[0])}
    except Exception as e:
        return {"ok": False, "error": str(e)}, 500


# --- FRONTEND ROUTES ---
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)


# --- Entry point ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
