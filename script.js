/* ===================== SUPER ADVANCED GOLD CLICKER ===================== */
(() => {
  // -------------------- CORE VARIABLES --------------------
  let coins = 0;
  let coinsPerClick = 1;
  let coinsPerSecond = 0;
  let prestigePoints = 0;
  let prestigeMultiplier = 1;
  let boosts = { active: false, multiplier: 2, end: 0 };
  let achievements = {};
  let lastTick = Date.now();
  const saveKey = "luxury-clicker-save-v1";

  // -------------------- DOM ELEMENTS --------------------
  const coinDisplay = document.getElementById("coins");
  const clickBtn = document.getElementById("clicker");
  const upgradesContainer = document.querySelector(".upgrades");
  const achievementsContainer = document.querySelector(".achievements");
  const prestigeBtn = document.getElementById("prestige-btn");
  const comboBtn = document.getElementById("combo-btn");
  const boostBtn = document.getElementById("boost-btn");

  // -------------------- AUDIO --------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function soundBeep(freq = 440, time = 0.06, vol = 0.07) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + time);
    o.stop(audioCtx.currentTime + time + 0.02);
  }

  // -------------------- DISPLAY UPDATE --------------------
  function updateDisplay() {
    coinDisplay.textContent = coins.toLocaleString();
    document.getElementById("cpc").textContent = coinsPerClick.toLocaleString();
    document.getElementById("cps").textContent = coinsPerSecond.toLocaleString();
    document.getElementById("prestige-points").textContent = prestigePoints.toLocaleString();
    document.getElementById("prestige-mult").textContent = `×${prestigeMultiplier.toFixed(2)}`;
  }

  // -------------------- CLICK FUNCTION --------------------
  clickBtn.addEventListener("click", () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    addCoins(coinsPerClick);
    spawnParticle();
  });

  // -------------------- ADD COINS --------------------
  function addCoins(amount) {
    if (boosts.active) amount *= boosts.multiplier;
    amount *= prestigeMultiplier;
    coins += Math.floor(amount);
    updateDisplay();
    soundBeep(440 + Math.random() * 200, 0.05, 0.05);
    checkAchievements();
  }

  // -------------------- GOLD PARTICLES --------------------
  function spawnParticle() {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = `${Math.random() * clickBtn.offsetWidth}px`;
    particle.style.top = `${Math.random() * clickBtn.offsetHeight}px`;
    particle.style.color = `gold`;
    clickBtn.appendChild(particle);

    particle.animate(
      [
        { transform: "translateY(0) scale(1)", opacity: 1 },
        { transform: "translateY(-100px) scale(1.5)", opacity: 0 }
      ],
      { duration: 800, easing: "ease-out" }
    );

    setTimeout(() => particle.remove(), 800);
  }

  // -------------------- AUTO COINS PER SECOND --------------------
  function tick() {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    coins += Math.floor(coinsPerSecond * dt * prestigeMultiplier * (boosts.active ? boosts.multiplier : 1));
    updateDisplay();
    if (boosts.active && now >= boosts.end) {
      boosts.active = false;
      alert("Boost ended!");
    }
  }
  setInterval(tick, 1000);

  // -------------------- UPGRADES --------------------
  const upgradeDefs = [
    { id: "u1", name: "Golden Finger", desc: "+1 CPC", baseCost: 50, type: "click", baseValue: 1 },
    { id: "u2", name: "Coin Factory", desc: "+1 CPS", baseCost: 200, type: "auto", baseValue: 1 },
    { id: "u3", name: "Luxury Multiplier", desc: "×2 coins", baseCost: 1000, type: "mult", baseValue: 2 },
    { id: "u4", name: "Golden Automaton", desc: "+5 CPS", baseCost: 5000, type: "auto", baseValue: 5 },
    { id: "u5", name: "Diamond Clicker", desc: "+10 CPC", baseCost: 10000, type: "click", baseValue: 10 },
  ];
  let upgradeState = {};
  upgradeDefs.forEach(u => upgradeState[u.id] = { qty: 0 });

  function getUpgradeCost(u) {
    const qty = upgradeState[u.id].qty;
    return Math.floor(u.baseCost * Math.pow(1.15, qty));
  }

  function buyUpgrade(id) {
    const u = upgradeDefs.find(x => x.id === id);
    const cost = getUpgradeCost(u);
    if (coins < cost) return;
    coins -= cost;
    upgradeState[id].qty++;
    if (u.type === "click") coinsPerClick += u.baseValue;
    if (u.type === "auto") coinsPerSecond += u.baseValue;
    if (u.type === "mult") prestigeMultiplier *= u.baseValue;
    updateDisplay();
    soundBeep(880, 0.06, 0.08);
    saveGame();
  }

  function renderUpgrades() {
    upgradesContainer.innerHTML = "";
    for (const u of upgradeDefs) {
      const div = document.createElement("div");
      div.className = "upgrade";
      div.innerHTML = `<b>${u.name}</b><br>${u.desc}<br>Cost: ${getUpgradeCost(u).toLocaleString()} <button>Buy</button>`;
      const btn = div.querySelector("button");
      btn.addEventListener("click", () => buyUpgrade(u.id));
      upgradesContainer.appendChild(div);
    }
  }

  // -------------------- ACHIEVEMENTS --------------------
  const achDefs = [
    { id: "a1", name: "First Click", desc: "Click once", cond: s => s.coins >= 1 },
    { id: "a2", name: "Collector", desc: "Reach 1,000 coins", cond: s => s.coins >= 1000 },
    { id: "a3", name: "Prestige Starter", desc: "Gain 1 prestige", cond: s => s.prestigePoints >= 1 },
  ];

  function checkAchievements() {
    for (const a of achDefs) {
      if (!achievements[a.id] && a.cond({ coins, prestigePoints })) {
        achievements[a.id] = true;
        alert(`Achievement unlocked: ${a.name}`);
        renderAchievements();
      }
    }
  }

  function renderAchievements() {
    achievementsContainer.innerHTML = "";
    for (const a of achDefs) {
      const div = document.createElement("div");
      div.className = "achievement";
      div.textContent = a.name + (achievements[a.id] ? " ✅" : "");
      achievementsContainer.appendChild(div);
    }
  }

  // -------------------- BOOSTS & COMBOS --------------------
  comboBtn.addEventListener("click", () => {
    coins += coinsPerClick * 10;
    spawnParticle();
    updateDisplay();
    soundBeep(1000, 0.06, 0.1);
  });

  boostBtn.addEventListener("click", () => {
    const cost = 500;
    if (coins < cost) return alert("Not enough coins for boost");
    coins -= cost;
    boosts.active = true;
    boosts.end = Date.now() + 30 * 1000;
    alert("Boost active for 30s!");
    updateDisplay();
  });

  // -------------------- PRESTIGE --------------------
  prestigeBtn.addEventListener("click", () => {
    const pts = Math.floor(Math.sqrt(coins / 10000));
    if (pts < 1) return alert("Not enough coins to prestige!");
    prestigePoints += pts;
    coins = 0;
    coinsPerClick = 1;
    coinsPerSecond = 0;
    prestigeMultiplier = 1 + prestigePoints * 0.05;
    upgradeState = {};
    upgradeDefs.forEach(u => upgradeState[u.id] = { qty: 0 });
    achievements = {};
    alert(`Prestiged! +${pts} prestige points`);
    updateDisplay();
    renderUpgrades();
    renderAchievements();
    saveGame();
  });

  // -------------------- ADMIN PANEL --------------------
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "a") {
      const pw = prompt("Enter admin password:");
      if (pw === "usv2025") openAdminPanel();
      else alert("Access denied");
    }
  });

  function openAdminPanel() {
    const action = prompt("Admin Panel: 1) Give Coins 2) Give Prestige 3) Unlock All Upgrades 4) Max CPS/CPC\nEnter choice:");
    switch (action) {
      case "1":
        coins += 1000000; break;
      case "2":
        prestigePoints += 100; prestigeMultiplier = 1 + prestigePoints * 0.05; break;
      case "3":
        upgradeDefs.forEach(u => { upgradeState[u.id].qty = 99; if (u.type === "click") coinsPerClick += u.baseValue*99; if (u.type === "auto") coinsPerSecond += u.baseValue*99; }); break;
      case "4":
        coinsPerClick = 999999; coinsPerSecond = 99999; break;
      default: alert("Canceled"); return;
    }
    updateDisplay();
    renderUpgrades();
    alert("Admin action applied!");
  }

  // -------------------- SAVE/LOAD --------------------
  function saveGame() {
    const data = { coins, coinsPerClick, coinsPerSecond, prestigePoints, prestigeMultiplier, boosts, achievements, upgradeState, lastTick };
    localStorage.setItem(saveKey, JSON.stringify(data));
  }

  function loadGame() {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      coins = data.coins || 0;
      coinsPerClick = data.coinsPerClick || 1;
      coinsPerSecond = data.coinsPerSecond || 0;
      prestigePoints = data.prestigePoints || 0;
      prestigeMultiplier = data.prestigeMultiplier || 1;
      boosts = data.boosts || boosts;
      achievements = data.achievements || {};
      upgradeState = data.upgradeState || {};
      lastTick = data.lastTick || Date.now();
    } catch(e) { console.warn("Failed to load save"); }
  }

  // -------------------- INIT --------------------
  function init() {
    loadGame();
    updateDisplay();
    renderUpgrades();
    renderAchievements();
    setInterval(saveGame, 15000);
  }

  init();
})();

