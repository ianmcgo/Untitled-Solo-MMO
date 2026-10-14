function log(msg, c) {
  const el = $("log");
  const d = document.createElement("div");
  d.className = c || "sys";
  d.textContent = msg;
  el.appendChild(d);
  while (el.children.length > 200) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function clearLog() { $("log").innerHTML = ""; }

function showKO(on) { $("ko").style.display = on ? "flex" : "none"; }

function openDialog(who, text, opts) {
  S.dialog = { who, text, opts };
  $("dlgWho").textContent = who;
  $("dlgText").textContent = text;
  const box = $("dlgOpts");
  box.innerHTML = "";
  const all = (opts || []).concat([{ label: "Close", fn: closeDialog }]);
  all.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = (i + 1) + ". " + o.label;
    b.onclick = () => o.fn();
    box.appendChild(b);
  });
  S.dialog.all = all;
  $("dialog").style.display = "block";
}

function closeDialog() {
  S.dialog = null;
  $("dialog").style.display = "none";
}

function uiPartyChanged() {
  S.partyKey = "";
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function itemDesc(id) {
  const it = ITEMS[id];
  const tags = (it.rare ? "Rare · " : "") + (it.ex ? "Ex · " : "");
  if (it.kind !== "equip") return tags + (it.desc || "");
  const parts = [SLOT_NAMES[it.slot]];
  if (it.wtype) parts.push(SKILL_NAMES[it.wtype] + " DMG " + it.dmg + " Delay " + it.delay);
  if (it.stats) for (const k in it.stats) parts.push(k.toUpperCase() + "+" + it.stats[k]);
  parts.push("Lv." + it.lv + " " + it.jobs.join("/"));
  return tags + parts.join(" · ");
}

function openModal(tab) {
  S.modal = tab;
  $("modal").style.display = "flex";
  renderModal();
}

function closeModal() {
  S.modal = null;
  $("modal").style.display = "none";
}

function renderModal() {
  if (!S.modal) return;
  const tabs = ["items", "equip", "status", "skills", "quests", "settings"];
  for (const t of ["shop", "job", "mercs"]) if (S.modal === t) tabs.push(t);
  const labels = { items: "Items", equip: "Equip", status: "Status", skills: "Skills", quests: "Quests", settings: "Settings", shop: "Shop", job: "Jobs", mercs: "Mercenaries" };
  $("mTabs").innerHTML = tabs.map(t => '<button data-tab="' + t + '"' + (t === S.modal ? ' class="on"' : "") + ">" + labels[t] + "</button>").join("") + '<button class="x" data-tab="close">Close (Esc)</button>';
  let h = "";
  if (S.modal === "items") {
    h += '<div class="sub" style="margin-bottom:6px">' + save.inventory.length + " / " + CONFIG.inventorySize + " slots · " + save.gil + " gil</div>";
    if (!save.inventory.length) h += '<div class="sub">Your bag is empty.</div>';
    save.inventory.forEach(s => {
      const it = ITEMS[s.id];
      let btn = "";
      if (it.kind === "use") btn = '<button data-a="use" data-v="' + s.id + '">Use</button>';
      if (it.kind === "equip") { const why = canEquip(s.id); btn = why ? '<span class="d bad">' + esc(why) + "</span>" : '<button data-a="equip" data-v="' + s.id + '">Equip</button>'; }
      h += '<div class="item"><div><div>' + (it.icon || "") + " " + esc(it.name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><div class="d">' + esc(itemDesc(s.id)) + "</div></div>" + btn + "</div>";
    });
  } else if (S.modal === "equip") {
    for (const slot of SLOTS) {
      const id = save.gear[slot];
      h += '<div class="item"><div><div><span class="sub">' + SLOT_NAMES[slot] + "</span> " + (id ? esc(ITEMS[id].name) : "—") + '</div><div class="d">' + (id ? esc(itemDesc(id)) : "") + "</div></div>" + (id ? '<button data-a="unequip" data-v="' + slot + '">Remove</button>' : "") + "</div>";
    }
    const usable = save.inventory.filter(s => ITEMS[s.id].kind === "equip");
    h += "<h3>In your bag</h3>";
    if (!usable.length) h += '<div class="sub">No equipment in your bag.</div>';
    usable.forEach(s => {
      const why = canEquip(s.id);
      h += '<div class="item"><div><div>' + esc(ITEMS[s.id].name) + '</div><div class="d">' + esc(itemDesc(s.id)) + "</div></div>" + (why ? '<span class="d bad">' + esc(why) + "</span>" : '<button data-a="equip" data-v="' + s.id + '">Equip</button>') + "</div>";
    });
  } else if (S.modal === "status") {
    const s = player.stats;
    const j = save.jobs[save.mainJob];
    h += "<div>" + JOBS[player.job].name + " Lv." + player.lv + (player.sub ? " / " + JOBS[player.sub].name + " Lv." + Math.floor(player.lv / 2) : "") + "</div>";
    h += '<div class="sub" style="margin-bottom:8px">XP ' + j.xp + " / " + (xpNeed(j.lv) || "cap") + " · " + save.gil + " crystals · Home point: " + ZONES[save.home.zone].name + "</div>";
    h += '<div class="grid2">';
    const rows = [["HP", player.maxHp], ["MP", player.maxMp], ["STR", s.str], ["DEX", s.dex], ["VIT", s.vit], ["AGI", s.agi], ["INT", s.int], ["MND", s.mnd], ["ATT", s.att], ["DEF", s.def], ["ACC", s.acc], ["EVA", s.eva], ["DMG", s.dmg], ["Delay", s.delay]];
    for (const [k, v] of rows) h += "<b>" + k + "</b><span>" + v + "</span>";
    h += "</div><h3>Job levels</h3>";
    for (const jb in JOBS) h += "<div>" + JOBS[jb].name + " Lv." + save.jobs[jb].lv + (jb === save.mainJob ? " (main)" : jb === save.subJob ? " (support)" : "") + "</div>";
  } else if (S.modal === "skills") {
    h += '<div class="sub" style="margin-bottom:8px">Skills rise as you use them, up to a cap set by your job and level. Each job keeps its own skills. Weapon skills unlock at weapon skill 5, 22 and 40.</div>';
    for (const sk of COMBAT_SKILLS.concat(MAGIC_SKILLS)) {
      const cap = skillCap(player, sk);
      if (cap <= 0) continue;
      const cur = Math.min((save.skills[player.job] || {})[sk] || 0, cap);
      const next = Object.values(WEAPON_SKILLS).filter(w => w.wtype === sk && w.skill > Math.floor(cur)).sort((a, b) => a.skill - b.skill)[0];
      h += '<div class="item"><div><div>' + SKILL_NAMES[sk] + (sk === player.stats.wtype ? " (equipped)" : "") + '</div><div class="d">' + (next ? "Next weapon skill: " + next.name + " at " + next.skill : "") + '</div></div><span>' + cur.toFixed(1) + " / " + cap + "</span></div>";
    }
  } else if (S.modal === "quests") {
    for (const id in QUESTS) {
      const st = save.quests[id];
      if (st === "none") continue;
      const label = { none: "Not started", active: "In progress", killed: "Report to Captain Rhea", done: "Complete" }[st];
      let prog = "";
      if (id === "pouches" && st === "active") prog = " (" + Math.min(3, invCount("goblin_pouch")) + "/3)";
      if (id === "riding" && st === "active") prog = " (" + Math.min(3, invCount("healing_herb")) + "/3 herbs, " + Math.min(300, save.gil) + "/300 crystals)";
      if (id === "support" && st === "active") prog = " (" + Math.min(2, invCount("bat_wing")) + "/2 wings, " + Math.min(1, invCount("worm_silk")) + "/1 silk)";
      h += '<div class="item"><div><div>' + esc(QUESTS[id].name) + ' <span class="sub">· ' + esc(QUESTS[id].giver) + '</span></div><div class="d">' + esc(QUESTS[id].desc) + '</div></div><span class="d">' + label + prog + "</span></div>";
    }
  } else if (S.modal === "settings") {
    h += "<h3>Save</h3>";
    h += '<div class="sub" style="margin-bottom:8px">Your progress saves automatically in this browser. Save to a file for a backup, or load a file to restore one or move to another device.</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap"><button data-a="savefile">Save to file</button><button data-a="loadfile">Load from file</button><button data-a="newgame">Start a new game</button></div>';
    h += '<input type="file" id="loadInput" accept=".json,application/json" style="display:none">';
    if (typeof graphicsSettingsHTML === "function") h += graphicsSettingsHTML();
    h += "<h3>Time</h3><div class=\"sub\">" + clockText() + " · " + (isNight() ? "night" : "day") + " · Today's element: " + dayElement() + " (+10% to " + dayElement() + " spells)</div>";
  } else if (S.modal === "shop") {
    h += '<div class="sub" style="margin-bottom:6px">' + save.gil + " gil</div><h3>Buy</h3>";
    shopList().forEach(id => { h += '<div class="item"><div><div>' + (ITEMS[id].icon || "") + " " + esc(ITEMS[id].name) + '</div><div class="d">' + esc(itemDesc(id)) + "</div></div><button data-a=\"buy\" data-v=\"" + id + '"' + (save.gil < ITEMS[id].price ? " disabled" : "") + ">" + ITEMS[id].price + " gil</button></div>"; });
    h += "<h3>Sell</h3>";
    const sellable = save.inventory.filter(s => sellPrice(s.id) > 0);
    if (!sellable.length) h += '<div class="sub">Nothing to sell.</div>';
    sellable.forEach(s => { h += '<div class="item"><div>' + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="sell" data-v="' + s.id + '">' + sellPrice(s.id) + " gil</button></div>"; });
  } else if (S.modal === "job") {
    h += "<h3>Main job</h3>";
    for (const jb in JOBS) h += '<div class="item"><div>' + JOBS[jb].name + ' <span class="sub">Lv.' + save.jobs[jb].lv + "</span></div>" + (jb === save.mainJob ? '<span class="d">Current</span>' : '<button data-a="main" data-v="' + jb + '">Set main</button>') + "</div>";
    h += "<h3>Support job</h3>";
    if (!save.supportUnlocked) h += '<div class="sub">Locked. ' + (player.lv < CONFIG.supportUnlockLevel ? "Reach level " + CONFIG.supportUnlockLevel + " and talk to Tobin." : "Complete Tobin's quest, A Second Calling.") + "</div>";
    else {
      h += '<div class="sub" style="margin-bottom:6px">Runs at half your main level (currently Lv.' + Math.floor(player.lv / 2) + ").</div>";
      for (const jb of ["none"].concat(Object.keys(JOBS))) {
        if (jb === save.mainJob) continue;
        const cur = (save.subJob || "none") === jb;
        h += '<div class="item"><div>' + (jb === "none" ? "None" : JOBS[jb].name) + "</div>" + (cur ? '<span class="d">Current</span>' : '<button data-a="sub" data-v="' + jb + '">Set support</button>') + "</div>";
      }
    }
  } else if (S.modal === "mercs") {
    h += '<div class="sub" style="margin-bottom:6px">Party ' + S.party.length + " / " + CONFIG.maxParty + " · " + save.gil + " crystals · Fees are paid once per hire.</div>";
    for (const id in MERCS) {
      const m = MERCS[id];
      const hired = save.hired.includes(id);
      const avail = mercAvailable(id);
      let btn;
      if (hired) btn = '<button data-a="dismiss" data-v="' + id + '">Dismiss</button>';
      else if (!avail) btn = '<span class="d">' + esc(mercLockedReason(id)) + "</span>";
      else btn = '<button data-a="hire" data-v="' + id + '"' + (save.gil < m.fee || save.hired.length >= CONFIG.maxParty - 1 ? " disabled" : "") + ">Hire · " + m.fee + " gil</button>";
      h += '<div class="item"><div><div>' + esc(m.name) + ' <span class="sub">' + (JOBS[m.job] ? JOBS[m.job].name : m.job) + " · " + m.role + '</span></div><div class="d">' + esc(m.desc) + "</div></div>" + btn + "</div>";
    }
  }
  $("mBody").innerHTML = h;
  const li = $("loadInput");
  if (li) li.onchange = onLoadFile;
}

function downloadSave() {
  const text = exportSaveText();
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  const d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = "untitled-solo-rpg-save-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  log("Save file downloaded.", "sys");
}

function onLoadFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const d = importSaveText(String(r.result));
    if (!d) { log("That file isn't a Leid'anav Reborn save.", "sys"); sfx("error"); return; }
    if (typeof confirm === "function" && !confirm("Load this save? Your current progress in this browser will be replaced.")) return;
    closeModal();
    applyLoadedSave(d);
  };
  r.readAsText(f);
}

function onModalClick(e) {
  const t = e.target.closest ? e.target.closest("button") : e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.tab) {
    if (t.dataset.tab === "close") closeModal(); else { S.modal = t.dataset.tab; renderModal(); }
    sfx("click");
    return;
  }
  const a = t.dataset.a, v = t.dataset.v;
  if (!a) return;
  if (typeof handleSettingAction === "function" && handleSettingAction(a, v)) { renderModal(); return; }
  if (a === "use") useItem(v);
  else if (a === "equip") equip(v);
  else if (a === "unequip") unequip(v);
  else if (a === "buy") buy(v);
  else if (a === "sell") sell(v);
  else if (a === "main") setJob(v, save.subJob);
  else if (a === "sub") setJob(save.mainJob, v === "none" ? null : v);
  else if (a === "hire") hireMerc(v);
  else if (a === "dismiss") dismissMerc(v);
  else if (a === "savefile") { downloadSave(); return; }
  else if (a === "loadfile") { $("loadInput").click(); return; }
  else if (a === "newgame") {
    if (typeof confirm === "function" && !confirm("Erase your progress and start over?")) return;
    startNewGame();
    closeModal();
    return;
  }
  renderModal();
}

function buildPartyPanel() {
  const el = $("party");
  el.innerHTML = "";
  S.party.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "member";
    row.innerHTML = '<div><div class="nm" id="pm' + i + 'n"></div><div class="jb" id="pm' + i + 'j"></div></div><div><div class="bars">' +
      '<div class="bar"><div id="pm' + i + 'hp" style="background:var(--hp)"></div><span id="pm' + i + 'hpt"></span></div>' +
      '<div class="bar"><div id="pm' + i + 'mp" style="background:var(--mp)"></div><span id="pm' + i + 'mpt"></span></div>' +
      '<div class="bar"><div id="pm' + i + 'tp" style="background:var(--tp)"></div><span id="pm' + i + 'tpt"></span></div></div>' +
      '<div class="bar thin"><div id="pm' + i + 'sw" style="background:#8fa3c7"></div></div></div>';
    row.onclick = () => setTarget(p);
    p.row = row;
    el.appendChild(row);
  });
  if (S.party.length === 1) {
    const tip = document.createElement("div");
    tip.className = "sub";
    tip.style.padding = "4px";
    tip.textContent = "Solo. Hire companions from Brann at the Mercenary Hall.";
    el.appendChild(tip);
  }
}

function setBar(id, v, max, tid, text) {
  $(id).style.width = (max > 0 ? clamp(100 * v / max, 0, 100) : 0) + "%";
  if (tid) $(tid).textContent = text;
}

function buildMacros() {
  const list = actionList(player);
  const key = list.map(a => a.id).join(",");
  if (key === S.macroKey) return;
  S.macroKey = key;
  S.macros = list;
  const el = $("macros");
  el.innerHTML = "";
  list.forEach((act, i) => {
    const b = document.createElement("button");
    b.className = "mac " + act.kind;
    b.innerHTML = '<span class="k">' + (i < 10 ? (i + 1) % 10 : "") + "</span>" + esc(act.name) + '<span class="c" id="mc' + i + '"></span>';
    b.onclick = () => playerAct(act);
    act.btn = b;
    el.appendChild(b);
  });
}

function updateMacros() {
  buildMacros();
  const at = player.attackTarget;
  S.macros.forEach((act, i) => {
    const t = resolveTarget(act);
    const why = checkAction(player, act, t);
    let c = "";
    const ready = !why;
    if (act.kind === "ws") {
      c = player.tp >= 1000 ? "Ready" : "1000 TP";
      if (at && at.chain && S.time >= at.chain.openAt && S.time <= at.chain.closeAt) {
        const r = findChain(at.chain.props, WEAPON_SKILLS[act.id].props);
        if (r) c = '<span class="sc">→ ' + r + "</span>";
      }
    } else if (act.kind === "ja") {
      const r = recastLeft(player, "ja:" + act.id);
      c = r > 0 ? fmt(r) + "s" : "Ready";
    } else {
      const sp = SPELLS[act.id];
      const r = recastLeft(player, "ma:" + act.id);
      c = sp.mp + " MP" + (r > 0 ? " · " + fmt(r) + "s" : "");
      if (sp.element && at && at.burst && at.burst.el.includes(sp.element)) c = '<span class="sc">Burst! </span>' + c;
    }
    const el = $("mc" + i);
    if (el.innerHTML !== c) el.innerHTML = c;
    act.btn.classList.toggle("dim", !ready);
    act.btn.classList.toggle("ready", act.kind === "ws" && ready);
  });
}

function updateHud() {
  const key = S.party.map(p => p.mercId || "me").join(",");
  if (key !== S.partyKey) { S.partyKey = key; buildPartyPanel(); }
  const j = save.jobs[save.mainJob];
  $("zoneName").textContent = S.zone.name;
  $("clock").textContent = (isNight() ? "☾ " : "☀ ") + clockText();
  $("lvl").textContent = player.job + player.lv + (player.sub ? "/" + player.sub + Math.floor(player.lv / 2) : "");
  const need = xpNeed(j.lv);
  $("xpfill").style.width = (need ? 100 * j.xp / need : 100) + "%";
  $("xpt").textContent = need ? j.xp + "/" + need + " XP" : "Level cap";
  $("crystals").textContent = save.gil + " crystals";
  S.party.forEach((p, i) => {
    $("pm" + i + "n").textContent = (p === player ? "★ You" : p.name);
    $("pm" + i + "j").textContent = p.job + p.lv + (p.sub ? "/" + p.sub + Math.floor(p.lv / 2) : "") + (p.casting ? " · casting" : p.regenerating ? " · regen" : p.engaged ? " · ⚔" : "");
    setBar("pm" + i + "hp", p.hp, p.maxHp, "pm" + i + "hpt", Math.ceil(p.hp));
    setBar("pm" + i + "mp", p.mp, p.maxMp, "pm" + i + "mpt", p.maxMp ? Math.floor(p.mp) : "");
    setBar("pm" + i + "tp", p.tp, CONFIG.tpMax, "pm" + i + "tpt", p.tp);
    const sw = p.casting ? (S.time - p.casting.start) / (p.casting.end - p.casting.start) : (p.engaged && p.alive ? 1 - p.swingTimer / p.delay : 0);
    $("pm" + i + "sw").style.width = 100 * clamp(sw, 0, 1) + "%";
    $("pm" + i + "sw").style.background = p.casting ? "#64b5f6" : "#8fa3c7";
    p.row.className = "member" + (player.target === p ? " sel" : "") + (p.alive ? "" : " ko");
  });
  const t = player.target;
  if (t && (isMob(t) || isParty(t))) {
    if (isMob(t)) {
      const [c, col] = conOf(t);
      $("tName").textContent = t.name;
      $("tName").style.color = col;
      $("tCon").textContent = "Lv." + t.lv + " · " + c;
      setBar("tHp", t.hp, t.maxHp, "tHpT", Math.round(100 * t.hp / t.maxHp) + "%");
      setBar("tTp", t.tp, CONFIG.tpMax, "tTpT", "TP " + t.tp);
      $("tSwing").style.width = (t.state === "combat" && t.alive ? 100 * clamp(1 - t.swingTimer / t.delay, 0, 1) : 0) + "%";
      const ag = t.fam.aggro ? Object.keys(t.fam.aggro).map(k => ({ sight: "sight", sound: "sound", magic: "magic", lowhp: "low HP" }[k])).join(", ") : "passive";
      let info = !t.alive ? "Defeated" : t.readying ? "Readying " + t.fam.tpMove.name + "!" : t.state === "combat" ? "Fighting " + (t.target ? obj(t.target) : "") : t.state === "return" ? "Returning home" : "Idle";
      info += " · aggro: " + ag + (t.fam.link ? " · links" : "") + (t.fam.nm ? " · Notorious" : "");
      if (player.engaged && player.attackTarget === t && t.alive) info += dist(player, t) <= CONFIG.meleeRange ? " · in range" : " · too far";
      $("tInfo").textContent = info;
      let ch = "";
      if (t.chain && S.time <= t.chain.closeAt) {
        const open = S.time >= t.chain.openAt;
        ch += '<span style="color:#f6a5ff">⛓ ' + esc(t.chain.props.join("/")) + "</span> " + (open ? "window " + fmt(t.chain.closeAt - S.time) + "s" : "opening…");
      }
      if (t.burst && S.time <= t.burst.until) ch += (ch ? " · " : "") + '<span style="color:' + ELEMENT_COLORS[t.burst.el[0]] + '">✦ Burst: ' + t.burst.el.join("/") + " " + fmt(t.burst.until - S.time) + "s</span>";
      if (t.buffs.dia) ch += (ch ? " · " : "") + '<span style="color:#fff59d">Dia</span>';
      if ($("chainInfo").innerHTML !== ch) $("chainInfo").innerHTML = ch;
    } else {
      $("tName").textContent = t === player ? "You" : t.name;
      $("tName").style.color = "#8ec5ff";
      $("tCon").textContent = t.job + t.lv + " · Party";
      setBar("tHp", t.hp, t.maxHp, "tHpT", Math.ceil(t.hp) + " / " + t.maxHp);
      setBar("tTp", t.mp, t.maxMp, "tTpT", t.maxMp ? "MP " + Math.floor(t.mp) : "");
      $("tSwing").style.width = "0%";
      const bf = Object.keys(t.buffs).map(k => BUFF_NAMES[k]).join(", ");
      $("tInfo").textContent = (t.alive ? "OK" : "KO") + (bf ? " · " + bf : "");
      $("chainInfo").innerHTML = "";
    }
  } else {
    $("tName").textContent = t && t.kind === "npc" ? t.name : "No target";
    $("tName").style.color = "";
    $("tCon").textContent = t && t.kind === "npc" ? "NPC" : "";
    setBar("tHp", 0, 1, "tHpT", "");
    setBar("tTp", 0, 1, "tTpT", "");
    $("tSwing").style.width = "0%";
    $("tInfo").textContent = t && t.kind === "npc" ? "Tap again or press E to talk." : "";
    $("chainInfo").innerHTML = "";
  }
  $("btnEngage").textContent = player.engaged ? (isMob(player.target) && player.target !== player.attackTarget ? "Switch (F)" : "Disengage (F)") : "Engage (F)";
  $("btnTalk").disabled = !nearNpc();
  const bm = $("btnMount");
  if (bm) { bm.style.display = save.mountLicense ? "" : "none"; bm.textContent = player.mounted ? "Dismount (R)" : "Mount (R)"; }
  updateMacros();
}

function sfx() {}
function mobVoice() {}
function surfaceAt() { return "grass"; }
function uiEvent() {}
