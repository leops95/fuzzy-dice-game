let dice = [1, 1, 1, 1, 1],
  held = [false, false, false, false, false],
  rollsLeft = 3;

let dieFaces = [
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6]
];

let faceSwapActive = false;
let faceSwapDone = false;

let usedCategories = {},
  scores = {},
  gameStarted = false,
  selectedCategory = null;

let goal = 200,
  coins = 0,
  bonuses = { ones: 0, twos: 0, threes: 0, fours: 0, fives: 0, sixes: 0 };

let extraRolls = 0;

let diceFacesUnlocked = false;

let upperMultipliers = { ones: 1, twos: 1, threes: 1, fours: 1, fives: 1, sixes: 1 },
  lowerMultipliers = {
    threeKind: 1,
    fourKind: 1,
    fullHouse: 1,
    smallStraight: 1,
    largeStraight: 1,
    yahtzee: 1,
    chance: 1
  };

let fibStep = 1,
  fibA = 1,
  fibB = 1,
  bonusThreshold = 63;

let hasRolled = 0;
let hasRegisteredFirstPoints = false;

let categoryBonuses = {
  threeKind: 0,
  fourKind: 0,
  fullHouse: 0,
  smallStraight: 0,
  largeStraight: 0,
  yahtzee: 0,
  chance: 0
};

let highlightedCategories = {},
  superscriptLevels = {};

let lastGameWon = false;

let lowerBonusPickCounts = {
  threeKind: 0,
  fourKind: 0,
  fullHouse: 0,
  smallStraight: 0,
  largeStraight: 0,
  yahtzee: 0,
  chance: 0
};

let shopOpen = false;

const MAX_ROUNDS = 10;
let currentRound = 1;
let gameFinished = false;

const rollButton = document.getElementById('rollButton'),
  confirmButton = document.getElementById('confirmButton');

const rollsLabel = document.getElementById('rolls-left'),
  totalScoreDisplay = document.getElementById('totalScore');

const gameOverMessage = document.getElementById('gameOverMessage'),
  goalText = document.getElementById('goalText');

const shopButtons = document.getElementById('shopButtons'),
  shopTitle = document.getElementById('shopTitle'),
  bonusBox = document.getElementById('bonusBox');

const showAllDiceButton = document.getElementById('showAllDiceButton'),
  allDiceFacesContainer = document.getElementById('allDiceFacesContainer'),
  scorecardSections = document.getElementById('scorecardSections');

const activateRollButton = document.getElementById('activateRollButton');

let playerName = prompt("Welcome! Please enter your player name:");
if (!playerName || playerName.trim() === "") playerName = "Anonymous";

localStorage.setItem("playerName", playerName);
document.getElementById("playerNameDisplay").textContent = `Player: ${playerName}`;
console.log("Player name:", playerName);

function toggleMainUI(visible) {
  const display = visible ? 'flex' : 'none';
  const inline = visible ? 'inline-block' : 'none';
  const block = visible ? 'block' : 'none';

  document.querySelector('.scorecard').style.display = display;
  document.getElementById('rollButton').style.display = inline;
  document.getElementById('confirmButton').style.display = inline;
  document.getElementById('rolls-left').style.display = block;
  document.getElementById('totalScore').style.display = block;
  document.getElementById('showAllDiceButton').style.display = visible ? (diceFacesUnlocked ? 'inline-block' : 'none') : 'none';
}

showAllDiceButton.onclick = () => {
  const isVisible = allDiceFacesContainer.style.display === 'flex';

  if (isVisible) {
    allDiceFacesContainer.style.display = 'none';

    document.querySelector('.scorecard').style.display = 'flex';

    document.getElementById('rollButton').style.display = 'inline-block';
    document.getElementById('confirmButton').style.display = 'inline-block';
    document.getElementById('totalScore').style.display = 'block';
    document.getElementById('rolls-left').style.display = 'block';

    showAllDiceButton.textContent = 'Show all dice faces';
  } else {
    document.querySelector('.scorecard').style.display = 'none';

    document.getElementById('rollButton').style.display = 'none';
    document.getElementById('confirmButton').style.display = 'none';
    document.getElementById('totalScore').style.display = 'none';
    document.getElementById('rolls-left').style.display = 'none';

    allDiceFacesContainer.style.display = 'flex';

    updateDiceDisplay();

    showAllDiceButton.textContent = 'Show scoreboard';
  }
};

const upperCats = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const lowerCats = ['threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];

const bonusOptions = [
  { desc: "+3 points to three of a kind for each <img class=\"die-small\" src=\"dice_3.png\">", apply: () => { categoryBonuses.threeKind += 3; } },
  { desc: "+4 points to four of a kind for each <img class=\"die-small\" src=\"dice_4.png\">", apply: () => { categoryBonuses.fourKind += 4; } },
  { desc: "+5 points to full house for each <img class=\"die-small\" src=\"dice_2.png\">", apply: () => { categoryBonuses.fullHouse += 5; } },
  { desc: "+10 points to small straight if it contains a <img class=\"die-small\" src=\"dice_5.png\">", apply: () => { categoryBonuses.smallStraight += 10; } },
  { desc: "+25 points to large straight if it contains a <img class=\"die-small\" src=\"dice_6.png\">", apply: () => { categoryBonuses.largeStraight += 25; } },
  {
    desc: "Doubles the chance section if it contains a <img class=\"die-small\" src=\"dice_1.png\">",
    apply: () => {
      if (lowerMultipliers.chance === 1) lowerMultipliers.chance = 2;
      else lowerMultipliers.chance *= 2;
    }
  }
];

function updateBonusBox() {
  bonusBox.innerHTML = `<div style="margin-bottom: 6px;">Current Face Bonuses:</div>
  <img class="die-small" src="dice_1.png"> +${bonuses.ones} &nbsp
  <img class="die-small" src="dice_2.png"> +${bonuses.twos}  &nbsp
  <img class="die-small" src="dice_3.png"> +${bonuses.threes}  &nbsp
  <img class="die-small" src="dice_4.png"> +${bonuses.fours}  &nbsp
  <img class="die-small" src="dice_5.png"> +${bonuses.fives}  &nbsp
  <img class="die-small" src="dice_6.png"> +${bonuses.sixes} &nbsp`;
}

function updateRollCounter() {
  document.getElementById('rollCounter').textContent = `Extra rolls: ${extraRolls}`;
  activateRollButton.disabled = extraRolls <= 0 || rollsLeft > 0 || isGameOver();
}

function updateShowAllDiceButtonVisibility() {
  showAllDiceButton.style.display = diceFacesUnlocked ? 'inline-block' : 'none';
}

activateRollButton.onclick = () => {
  if (extraRolls <= 0 || rollsLeft > 0 || isGameOver()) return;

  extraRolls--;
  rollsLeft++;
  updateRollCounter();

  rollButton.disabled = false;
  document.querySelectorAll('.die').forEach(die => die.style.pointerEvents = 'auto');
  rollsLabel.textContent = `Rolls left: ${rollsLeft}`;
};

function buildShop() {
  shopButtons.innerHTML = "";

  shopTitle.textContent = "Bonus shop";

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(2, 1fr)";
  grid.style.gridGap = "30px";
  grid.style.justifyItems = "center";
  grid.style.marginTop = "10px";

  function makeButton(label, cost, callback) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "shop-btn";
    btn.style.width = "90%";

    const canBuy = shopOpen && coins >= cost;
    btn.disabled = !canBuy;

    btn.onclick = () => {
      if (!shopOpen || coins < cost) return;
      coins -= cost;
      updateCoins();
      callback();
    };
    return btn;
  }

  const rollBtn = document.createElement("button");
  rollBtn.textContent = "Buy extra roll (2🪙)";
  rollBtn.className = "shop-btn";
  rollBtn.style.width = "90%";
  const canBuyRoll = shopOpen && coins >= 2;
  rollBtn.disabled = !canBuyRoll;
  rollBtn.onclick = () => {
    if (!shopOpen || coins < 2) return;
    coins -= 2;
    extraRolls++;
    updateRollCounter();
    updateCoins();
    buildShop();
  };

  const faceValueBtn = makeButton("Add points to a face value (2🪙)", 2, showRandomFaceValueOptions);

  const lowerSectionBtn = makeButton("Improve the lower section (3🪙)", 3, showRandomBonusOptions);

  const faceSwapBtn = makeButton("Swap a dice face (5🪙)", 5, applyRandomFaceSwapBonus);

  grid.appendChild(rollBtn);
  grid.appendChild(faceValueBtn);
  grid.appendChild(lowerSectionBtn);
  grid.appendChild(faceSwapBtn);

  shopButtons.appendChild(grid);

  const infoLine = document.createElement("p");
  infoLine.textContent = "You can buy bonuses only between games and after collecting coins.";
  infoLine.style.color = "#2F3A3D";
  infoLine.style.fontSize = "14px";
  infoLine.style.marginTop = "50px";
  infoLine.style.textAlign = "left";
  shopButtons.appendChild(infoLine);
}

function applyRandomFaceSwapBonus() {
  const possibleFaces = [1, 2, 3, 4, 5, 6];
  let selectedFaces = [];

  while (selectedFaces.length < 3) {
    const randomFace = possibleFaces[Math.floor(Math.random() * possibleFaces.length)];
    if (!selectedFaces.includes(randomFace)) {
      selectedFaces.push(randomFace);
    }
  }

  shopButtons.innerHTML = "<p style='font-weight:bold; text-align:center;'>Choose one face to apply:</p>";

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "bonus-options-container";

  selectedFaces.forEach((face) => {
    const btn = document.createElement("button");
    btn.innerHTML = `Face: <img class="die-small" src="dice_${face}.png">`;
    btn.className = "shop-btn";
    btn.onclick = () => {
      faceSwapActive = true;
      faceSwapDone = false;

      shopButtons.innerHTML = `
        <p style="font-weight:bold; text-align:center;">Choose a dice face to apply your chosen bonus on:</p>
        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
          <img src="dice_${face}.png" class="die-bonus" style="width:60px; height:60px;">
          <span style="font-size:120px; line-height:1; transform: translateY(-25px);">&#8594;</span>
      </div>
      `;

      showDiceFacesToChoose(face);
    };
    optionsContainer.appendChild(btn);
  });

  shopButtons.appendChild(optionsContainer);
}

function showDiceFacesToChoose(selectedFace) {
  if (!faceSwapActive || faceSwapDone) return;
  toggleMainUI(false);
  allDiceFacesContainer.style.display = "flex";

  dice.forEach((val, i) => {
    const dieFaceWrapper = document.getElementById(`dieFaces${i}`);
    const faces = dieFaceWrapper.getElementsByClassName("all-die");

    for (let j = 0; j < 6; j++) {
      faces[j].src = `dice_${dieFaces[i][j]}.png`;
    }

    const clone = dieFaceWrapper.cloneNode(true);
    dieFaceWrapper.replaceWith(clone);

    Array.from(clone.getElementsByClassName("all-die")).forEach((img, faceIndex) => {
      img.onclick = () => {
        if (!faceSwapActive || faceSwapDone) return;

        dieFaces[i][faceIndex] = selectedFace;
        updateDiceDisplay();

        faceSwapDone = true;
        faceSwapActive = false;

        diceFacesUnlocked = true;
        updateShowAllDiceButtonVisibility();

        allDiceFacesContainer.style.display = 'none';
        toggleMainUI(true);
        showAllDiceButton.textContent = 'Show all dice faces';

        buildShop();
      };
    });
  });
}

function showRandomBonusOptions() {
  shopButtons.innerHTML = "<p style='font-weight:bold; text-align:center;'>Choose one bonus:</p>";

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "bonus-choice-container";

  const weightedOptions = [];

  bonusOptions.forEach(opt => {
    if (opt.desc.toLowerCase().includes("chance")) {
      for (let i = 0; i < 5; i++) weightedOptions.push(opt);
    } else {
      for (let i = 0; i < 38; i++) weightedOptions.push(opt);
    }
  });

  const selected = [];

  while (selected.length < 3) {
    const pick = weightedOptions[Math.floor(Math.random() * weightedOptions.length)];

    if (!selected.includes(pick)) {
      selected.push(pick);
    }
  }

  selected.forEach(opt => {
    const obtn = document.createElement("button");

    obtn.innerHTML = opt.desc;
    obtn.className = "shop-btn";

    obtn.onclick = () => {
      opt.apply();

      const lowerMap = {
        "three of a kind": "threeKind",
        "four of a kind": "fourKind",
        "full house": "fullHouse",
        "small straight": "smallStraight",
        "large straight": "largeStraight",
        "yahtzee": "yahtzee",
        "chance": "chance"
      };

      for (const key in lowerMap) {
        if (opt.desc.toLowerCase().includes(key)) {
          const k = lowerMap[key];

          lowerBonusPickCounts[k] = (lowerBonusPickCounts[k] || 0) + 1;

          const el = document.querySelector(`.score-row[data-category='${k}']`);

          if (el) {
            highlightedCategories[k] = true;

            let count = (superscriptLevels[k] || 0) + 1;

            superscriptLevels[k] = count;

            let existingSup = el.querySelector('.superscript');

            if (existingSup) existingSup.remove();

            const sup = document.createElement('sup');

            sup.className = 'superscript';
            sup.textContent = `+${count}`;

            el.appendChild(sup);

            if (count >= 7) {
              el.style.backgroundColor = '#ffdd99';
            } else if (count >= 5) {
              el.style.backgroundColor = '#d6b3ff';
            } else if (count >= 3) {
              el.style.backgroundColor = '#b3e5ff';
            } else {
              el.style.backgroundColor = '#99ff99';
            }

            highlightedCategories[k] = el.style.backgroundColor;
          }
        }
      }

      shopButtons.innerHTML = "";
      buildShop();
    };

    optionsContainer.appendChild(obtn);
  });

  shopButtons.appendChild(optionsContainer);
}

function showRandomFaceValueOptions() {
  shopButtons.innerHTML = "<p style='font-weight:bold; text-align:center;'>Choose one face bonus:</p>";

  const faceBonusList = [
    { face: 1, symbol: "<img class=\"die-small\" src=\"dice_1.png\">" },
    { face: 2, symbol: "<img class=\"die-small\" src=\"dice_2.png\">" },
    { face: 3, symbol: "<img class=\"die-small\" src=\"dice_3.png\">" },
    { face: 4, symbol: "<img class=\"die-small\" src=\"dice_4.png\">" },
    { face: 5, symbol: "<img class=\"die-small\" src=\"dice_5.png\">" },
    { face: 6, symbol: "<img class=\"die-small\" src=\"dice_6.png\">" }
  ];

  const options = faceBonusList.sort(() => 0.5 - Math.random()).slice(0, 3);

  options.forEach(opt => {
    const roll = Math.random();
    let bonusValue = 1;
    if (roll < 0.02) bonusValue = 3;
    else if (roll < 0.10) bonusValue = 2;

    opt.bonusValue = bonusValue;

    if (bonusValue === 2) opt.marker = ' <span style="color: #fcdea2;">(rare!)</span>';
    else if (bonusValue === 3) opt.marker = ' <span style="color: #fcdea2;">(very rare!)</span>';
    else opt.marker = "";
  });

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "bonus-choice-container";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerHTML = `All ${opt.symbol} give +${opt.bonusValue} points${opt.marker}`;
    btn.className = "shop-btn";
    btn.onclick = () => {
      const keyMap = ["", "ones", "twos", "threes", "fours", "fives", "sixes"];
      const cat = keyMap[opt.face];
      bonuses[cat] += opt.bonusValue;

      updateBonusBox();
      shopButtons.innerHTML = "";
      buildShop();
    };
    optionsContainer.appendChild(btn);
  });

  shopButtons.appendChild(optionsContainer);
}

document.getElementById('rulesButton').onclick = () => {
  window.open("https://www.youtube.com/watch?v=5Zzttnc4C8w", "_blank");
};

function nextFibonacci() { const next = fibA + fibB; fibA = fibB; fibB = next; return next; }

document.getElementById('debugButton').addEventListener('click', () => {
  totalScoreDisplay.textContent = `Total score: ${goal}`;
  coins += 10;
  shopOpen = true;
  updateCoins();
  gameOverMessage.textContent = `Debug win!`;

  lastGameWon = true;

  scores = {};
  usedCategories = {};
  updateBonusBox();

  applyFibonacciProgression();

  resetTurn();

  buildShop();
});

function applyFibonacciProgression() {
  const fibValue = nextFibonacci();
  goal += 10 * fibValue;

  bonusThreshold = 63;
  document.getElementById('bonusThresholdDisplay').textContent = bonusThreshold;
  currentRound++;
  updateGoalText();
  updateRoundText();
}

function updateGoalText() { goalText.textContent = `Goal: ${goal} points`; }

function updateRoundText() {
  const roundText = document.getElementById('roundText');
  if (roundText) roundText.textContent = `Round: ${currentRound} on ${MAX_ROUNDS}`;
}

function updateCoins() {
  shopTitle.textContent = "Bonus shop";
  document.getElementById("coinBalance").innerHTML = `Current balance: ${coins}🪙`;
}

function updateDiceDisplay() {
  dice.forEach((val, i) => {
    const die = document.getElementById(`die${i}`);
    if (!gameStarted) {
      die.src = "before_throw.png";
    } else {
      die.src = `dice_${val}.png`;
    }
    die.classList.toggle('held', held[i]);

    const dieFaceWrapper = document.getElementById(`dieFaces${i}`);
    const faces = dieFaceWrapper.getElementsByClassName("all-die");

    for (let j = 0; j < 6; j++) {
      faces[j].src = `dice_${dieFaces[i][j]}.png`;
    }
  });
}

function toggleHold(i) { if (!gameStarted || rollsLeft === 3 || isGameOver() || rollsLeft === 0) return; held[i] = !held[i]; updateDiceDisplay(); }
function sum(a) { return a.reduce((x, y) => x + y, 0); }
function counts(a) { const c = [0, 0, 0, 0, 0, 0, 0]; a.forEach(v => c[v]++); return c; }
function hasStraight(len) { const u = [...new Set(dice)].sort((a, b) => a - b); let run = 1, max = 1; for (let i = 1; i < u.length; i++) { run = (u[i] === u[i - 1] + 1) ? run + 1 : 1; max = Math.max(max, run); } return max >= len; }

function calcScore(cat) {
  const cts = counts(dice);

  const sumWithFaceBonuses = dice.reduce((total, face) => {
    const keyMap = ["", "ones", "twos", "threes", "fours", "fives", "sixes"];
    const key = keyMap[face];
    const faceBonus = bonuses[key] || 0;
    return total + (face + faceBonus);
  }, 0);

  switch (cat) {
    case 'ones': return cts[1] * (1 + bonuses.ones);
    case 'twos': return cts[2] * (2 + bonuses.twos);
    case 'threes': return cts[3] * (3 + bonuses.threes);
    case 'fours': return cts[4] * (4 + bonuses.fours);
    case 'fives': return cts[5] * (5 + bonuses.fives);
    case 'sixes': return cts[6] * (6 + bonuses.sixes);

    case 'threeKind':
      if (cts.some(x => x >= 3)) {
        let base = sumWithFaceBonuses;
        if (categoryBonuses.threeKind > 0 && cts[3] > 0) {
          base += cts[3] * categoryBonuses.threeKind;
        }
        return base;
      }
      return 0;

    case 'fourKind':
      if (cts.some(x => x >= 4)) {
        let base = sumWithFaceBonuses;
        if (categoryBonuses.fourKind > 0 && cts[4] > 0) {
          base += cts[4] * categoryBonuses.fourKind;
        }
        return base;
      }
      return 0;

    case 'fullHouse':
      if (cts.includes(3) && cts.includes(2)) {
        let base = 25;
        if (categoryBonuses.fullHouse > 0 && cts[2] > 0) {
          base += cts[2] * categoryBonuses.fullHouse;
        }
        return base;
      }
      return 0;

    case 'smallStraight':
      if (hasStraight(4)) {
        let base = 30;
        if (dice.includes(5)) base += categoryBonuses.smallStraight;
        return base;
      }
      return 0;

    case 'largeStraight':
      if (hasStraight(5)) {
        let base = 40;
        if (dice.includes(6)) base += categoryBonuses.largeStraight;
        return base;
      }
      return 0;

    case 'yahtzee':
      if (cts.includes(5)) {
        return 50 + categoryBonuses.yahtzee;
      }
      return 0;

    case 'chance':
      let base = sumWithFaceBonuses;
      if (dice.includes(1) && lowerMultipliers.chance > 1)
        base *= lowerMultipliers.chance;
      return base + categoryBonuses.chance;

    default:
      return 0;
  }
}

function isGameOver() { return gameFinished || Object.keys(usedCategories).length === upperCats.length + lowerCats.length; }

function updateDieFacesDisplay() {
  dice.forEach((value, index) => {
    const dieFaceContainer = document.getElementById(`dieFaces${index}`);
    const faces = dieFaceContainer.getElementsByClassName("all-die");

    dieFaces[index].forEach((faceValue, i) => {
      const face = faces[i];
      face.src = `dice_${faceValue}.png`;
    });
  });
}

let diceRolling = false;
let diceRollTimer = null;
let diceRollGeneration = 0;

function animateDiceRoll(finalDice, callback) {
  clearInterval(diceRollTimer);
  diceRolling = true;
  const generation = ++diceRollGeneration;
  const diceElements = document.querySelectorAll('.die');

  diceElements.forEach((die, i) => {
    if (!held[i]) {
      die.classList.add('rolling');
    }
    die.style.pointerEvents = 'none';
  });

  let ticks = 0;
  const totalTicks = 8;

  diceRollTimer = setInterval(() => {
    if (generation !== diceRollGeneration) {
      clearInterval(diceRollTimer);
      return;
    }

    dice.forEach((currentValue, i) => {
      if (held[i]) return;

      const faces = dieFaces[i];
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      document.getElementById(`die${i}`).src = `dice_${randomFace}.png`;
    });

    ticks++;

    if (ticks >= totalTicks) {
      clearInterval(diceRollTimer);

      dice.forEach((_, i) => {
        document.getElementById(`die${i}`).src = `dice_${finalDice[i]}.png`;
      });

      diceElements.forEach(die => {
        die.classList.remove('rolling');
        void die.offsetWidth;
      });

      if (callback) callback();

      diceRolling = false;

      diceElements.forEach(die => {
        die.style.pointerEvents = rollsLeft === 0 ? 'none' : 'auto';
      });
    }
  }, 65);
}

function rollDice() {
  if (shopOpen && hasRolled === 0) {
    shopOpen = false;
    buildShop();
    gameOverMessage.textContent = "";
  }

  const isFirstRoll = hasRolled === 0;
  const hasRegisteredPoints = hasRegisteredFirstPoints;
  if (isFirstRoll && !hasRegisteredPoints) {
    gameOverMessage.textContent = "";
  }

  if (rollsLeft <= 0 || isGameOver() || diceRolling) return;

  if (hasRolled === 0) hasRolled = 1;

  gameStarted = true;

  if (isFirstRoll && !hasRegisteredPoints) {
    gameOverMessage.style.color = "red";
    gameOverMessage.textContent = "Click the dice to hold them before rolling again";
  }
  const rolledDice = dice.map((d, i) =>
    held[i] ? d : dieFaces[i][Math.floor(Math.random() * dieFaces[i].length)]
  );
  rollsLeft--;

  if (!isFirstRoll && !hasRegisteredPoints && rollsLeft > 0) {
    gameOverMessage.style.color = "red";
    gameOverMessage.textContent = "Provisional points are automatically calculated (in gray)";
  } else if (rollsLeft === 0 && !hasRegisteredPoints) {
    gameOverMessage.style.color = "red";
    gameOverMessage.textContent = "Now, click on a cell to bank your points";
  } else if (rollsLeft === 0) {
    gameOverMessage.textContent = "";
  }

  rollsLabel.textContent = `Rolls left: ${rollsLeft}`;
  updateRollCounter();

  if (rollsLeft === 0 && lastGameWon) {
    buildShop();
  }

  if (rollsLeft > 0) {
    document.querySelectorAll('.die').forEach(die => die.style.pointerEvents = 'auto');
  }

  rollButton.disabled = true;

  animateDiceRoll(rolledDice, () => {
    dice = rolledDice;

    if (rollsLeft === 0) {
      held = [true, true, true, true, true];
      document.querySelectorAll('.die').forEach(die => {
        die.style.pointerEvents = 'none';
      });
    }

    updateDiceDisplay();
    renderScorecard();
    updateDieFacesDisplay();
    rollButton.disabled = rollsLeft === 0;
  });
}

function resetTurn() {
  if (typeof lastGameWon === "undefined") lastGameWon = false;
  rollsLeft = 3;
  held = [false, false, false, false, false];
  rollButton.disabled = isGameOver();
  confirmButton.disabled = true;
  selectedCategory = null;
  updateRollCounter();
  gameStarted = false;
  dice = [1, 1, 1, 1, 1];
  hasRolled = 0;
  updateDiceDisplay();
  renderScorecard();
  if (isGameOver()) recordFinalScore();
}

function renderScorecard() {
  const all = document.querySelectorAll('.score-row');
  const upperRawScore = upperCats.reduce((a, c) => a + (scores[c] || 0), 0);
  const upperScore = upperRawScore;
  const upperBonus = Math.floor(upperRawScore / bonusThreshold) * 35;

  document.getElementById('upperScoreDisplay').textContent =
    `Upper score: ${upperScore}${upperBonus > 0 ? ` + ${upperBonus}` : ''}`;
  document.getElementById('upperBonus').textContent = `Bonus: ${upperBonus}`;
  document.getElementById('bonusThresholdDisplay').textContent = bonusThreshold;

  const displayNames = {
    ones: "Sum of ones",
    twos: "Sum of twos",
    threes: "Sum of threes",
    fours: "Sum of fours",
    fives: "Sum of fives",
    sixes: "Sum of sixes",
    threeKind: "Three of a kind",
    fourKind: "Four of a kind",
    fullHouse: "Full house",
    smallStraight: "Small straight",
    largeStraight: "Large straight",
    yahtzee: "Yahtzee",
    chance: "Chance"
  };

  all.forEach(row => {
    const cat = row.dataset.category;
    const valBox = document.getElementById(`value-${cat}`);
    const pot = (gameStarted && rollsLeft < 3 && !usedCategories[cat]) ? calcScore(cat) : '';
    const name = displayNames[cat] || cat;

    row.textContent = name;

    if (usedCategories[cat]) {
      valBox.textContent = scores[cat];
      valBox.classList.remove('preview');
      row.classList.add('used');
      row.style.cursor = "default";
      row.style.backgroundColor = "#CFCAC0";
    } else {
      valBox.textContent = (pot !== '' ? pot : 0);
      row.classList.remove('used');
      row.style.cursor = "pointer";

      valBox.classList.add('preview');

      if (highlightedCategories[cat]) {
        row.style.backgroundColor = highlightedCategories[cat];
        row.dataset.bonus = "true";
      } else {
        row.style.backgroundColor = "#F7F5EF";
        row.dataset.bonus = "false";
      }
    }

    if (superscriptLevels[cat]) {
      let existingSup = row.querySelector('.superscript');
      if (!existingSup) {
        const sup = document.createElement('sup');
        sup.className = 'superscript';
        sup.textContent = `+${superscriptLevels[cat]}`;
        row.appendChild(sup);
      }
    }

    row.onclick = () => {
      if (usedCategories[cat] || !gameStarted || isGameOver()) return;

      const isFirstCellSelection = !hasRegisteredFirstPoints && selectedCategory === null;

      selectedCategory = cat;
      all.forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      confirmButton.disabled = false;

      if (isFirstCellSelection) {
        gameOverMessage.style.color = "red";
        gameOverMessage.textContent = "Then, confirm your choice";
      }
    };
  });

  const lowerScore = lowerCats.reduce((a, c) => a + (scores[c] || 0), 0);
  document.getElementById('lowerScoreDisplay').textContent = `Lower score: ${lowerScore}`;
  const total = sum(Object.values(scores)) + upperBonus;
  totalScoreDisplay.textContent = `Total score: ${total}`;
}

function recordFinalScore() {
  const upper = upperCats.reduce((a, c) => a + (scores[c] || 0), 0);
  const bonus = Math.floor(upper / bonusThreshold) * 35;
  const total = sum(Object.values(scores)) + bonus;

  const upper_row_points = {};
  upperCats.forEach(cat => { upper_row_points[cat] = scores[cat] || 0; });

  const lower_row_points = {};
  lowerCats.forEach(cat => { lower_row_points[cat] = scores[cat] || 0; });

  sendScoreToServer(
    playerName,
    total,
    goal,
    upper_row_points,
    lower_row_points
  );

  const collectBtn = document.getElementById("collectCoinsButton");
  const balanceDisplay = document.getElementById("coinBalance");

  if (total < goal) {
    lastGameWon = false;
    gameOverMessage.style.color = "red";
    gameOverMessage.innerHTML = `You lost! (Score below ${goal})`;
    rollButton.disabled = true;
    confirmButton.disabled = true;
    collectBtn.disabled = true;
    collectBtn.style.cursor = "not-allowed";

    categoryBonuses = {
      threeKind: 0,
      fourKind: 0,
      fullHouse: 0,
      smallStraight: 0,
      largeStraight: 0,
      yahtzee: 0,
      chance: 0
    };
    highlightedCategories = {};
    superscriptLevels = {};
    lowerMultipliers = {
      threeKind: 1,
      fourKind: 1,
      fullHouse: 1,
      smallStraight: 1,
      largeStraight: 1,
      yahtzee: 1,
      chance: 1
    };
    lowerBonusPickCounts = {
      threeKind: 0, fourKind: 0, fullHouse: 0,
      smallStraight: 0, largeStraight: 0, yahtzee: 0, chance: 0
    };

    buildShop();
    updateBonusBox();
    renderScorecard()
  } else {
    const earned = 2 + Math.floor((total - goal) / 5);
    lastGameWon = true;

    gameOverMessage.innerHTML = `
      You won! You earned +${earned}🪙
    `;

    collectBtn.disabled = false;
    collectBtn.style.cursor = "pointer";
    collectBtn.textContent = "Collect coins";
    collectBtn.onclick = () => {
      coins += earned;
      balanceDisplay.innerHTML = `Current balance: ${coins}🪙`;
      updateCoins();

      collectBtn.disabled = true;
      collectBtn.style.cursor = "not-allowed";
      collectBtn.textContent = "Collect coins";

      if (currentRound >= MAX_ROUNDS) {
        gameFinished = true;
        rollButton.disabled = true;
        confirmButton.disabled = true;
        gameOverMessage.style.color = "red";
        gameOverMessage.textContent = "You broke the game! this is quite the achievement, congrats!";
        return;
      }

      shopOpen = true;
      buildShop();

      gameOverMessage.style.color = "red";
      gameOverMessage.textContent = "The bonus shop is open!";

      applyFibonacciProgression();

      usedCategories = {};
      scores = {};
      resetTurn();
      buildShop();
    };
  }

  buildShop();
}

async function sendScoreToServer(player, score, threshold, upper_row_points, lower_row_points) {
  try {
    const response = await fetch(`https://fuzzy-dice-game.onrender.com/api/submit_score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player,
        score,
        threshold,
        face_value_bonus: bonuses,
        lower_section_bonus: lowerBonusPickCounts,
        face_swap_bonus: dieFaces,
        upper_row_points,
        lower_row_points
      })
    });
    const data = await response.json();
    console.log("Score + all bonuses submitted:", data);
  } catch (err) {
    console.error("Error sending score:", err);
  }
}

function newGame() {
  dice = [1, 1, 1, 1, 1];
  dieFaces = [
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6]
  ];
  held = [false, false, false, false, false];
  rollsLeft = 3;
  usedCategories = {};
  scores = {};
  hasRolled = 0;
  gameStarted = false;
  selectedCategory = null;
  hasRegisteredFirstPoints = false;
  rollButton.disabled = false;
  confirmButton.disabled = true;
  rollsLabel.textContent = "Rolls left: 3";
  gameOverMessage.textContent = "";
  goal = 200;
  coins = 0;
  extraRolls = 0;
  diceFacesUnlocked = false;
  currentRound = 1;
  gameFinished = false;
  document.getElementById("coinBalance").innerHTML = `Current balance: ${coins}🪙`;
  document.getElementById("collectCoinsButton").disabled = true;
  document.getElementById("collectCoinsButton").textContent = "Collect coins";
  bonusThreshold = 63;
  fibA = 1;
  fibB = 1;
  highlightedCategories = {};
  superscriptLevels = {};
  bonuses = { ones: 0, twos: 0, threes: 0, fours: 0, fives: 0, sixes: 0 };
  upperMultipliers = { ones: 1, twos: 1, threes: 1, fours: 1, fives: 1, sixes: 1 };
  lowerMultipliers = { threeKind: 1, fourKind: 1, fullHouse: 1, smallStraight: 1, largeStraight: 1, yahtzee: 1, chance: 1 };
  lowerBonusPickCounts = { threeKind: 0, fourKind: 0, fullHouse: 0, smallStraight: 0, largeStraight: 0, yahtzee: 0, chance: 0 };
  updateGoalText();
  updateRoundText();
  updateCoins();
  buildShop();
  updateDiceDisplay();
  renderScorecard();
  updateBonusBox();
  updateRollCounter();
  updateShowAllDiceButtonVisibility();
}

confirmButton.onclick = () => {
  if (!selectedCategory) return;

  const isFirstConfirmation = !hasRegisteredFirstPoints;
  hasRegisteredFirstPoints = true;

  const pts = calcScore(selectedCategory);
  scores[selectedCategory] = pts;
  usedCategories[selectedCategory] = true;
  resetTurn();

  if (isFirstConfirmation) {
    gameOverMessage.style.color = "red";
    gameOverMessage.textContent = "Great, carry on! and good luck!";
    setTimeout(() => {
      document.addEventListener('click', function clearFirstConfirmMsg(e) {
        if (e.target.closest('button')) {
          gameOverMessage.textContent = "";
          document.removeEventListener('click', clearFirstConfirmMsg);
        }
      });
    }, 0);
  }
};

rollButton.onclick = rollDice;
document.querySelectorAll('.die').forEach((d, i) => d.onclick = () => toggleHold(i));
document.getElementById('newGameButton').onclick = newGame;

updateGoalText();
updateRoundText();
updateCoins();
buildShop();
updateDiceDisplay();
renderScorecard();
updateBonusBox();
updateRollCounter();
updateShowAllDiceButtonVisibility();
gameOverMessage.style.color = "red";
gameOverMessage.textContent = "Roll the dice to begin";

const privacyLink = document.getElementById('privacyLink');
const privacyModal = document.getElementById('privacyModal');
const privacyClose = document.getElementById('privacyClose');

function openPrivacy() { privacyModal.style.display = 'block'; }
function closePrivacy() { privacyModal.style.display = 'none'; }

privacyLink.addEventListener('click', openPrivacy);
privacyClose.addEventListener('click', closePrivacy);
privacyModal.addEventListener('click', (e) => {
  if (e.target === privacyModal) closePrivacy();
});

const disclaimerLink = document.getElementById('disclaimerLink');
const disclaimerModal = document.getElementById('disclaimerModal');
const disclaimerClose = document.getElementById('disclaimerClose');

function openDisclaimer() { disclaimerModal.style.display = 'block'; }
function closeDisclaimer() { disclaimerModal.style.display = 'none'; }

disclaimerLink.addEventListener('click', openDisclaimer);
disclaimerClose.addEventListener('click', closeDisclaimer);
disclaimerModal.addEventListener('click', (e) => {
  if (e.target === disclaimerModal) closeDisclaimer();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (privacyModal.style.display === 'block') closePrivacy();
    if (disclaimerModal.style.display === 'block') closeDisclaimer();
  }
});