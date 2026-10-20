const fs = require('fs');
const { G } = require('./harness.js');
const ids = Object.keys(G.ITEMS).filter(id => G.ahTradable(id) && G.ITEMS[id].price > 0).sort();
const vals = ids.map(id => "('" + id + "', " + Math.max(1, Math.round(G.ITEMS[id].price * G.CONFIG.shopMul * G.AH_CFG.shopRatio)) + ")");
const towns = G.ahTowns().map(t => "('" + t + "', '" + G.ahTownName(t).replace(/'/g, "''") + "')");
const out = "insert into game_private.ah_towns (id, name) values " + towns.join(", ") + " on conflict (id) do update set name = excluded.name;\n" +
  "insert into game_private.ah_item_ref (item, price) values\n" + vals.join(",\n") + "\non conflict (item) do update set price = excluded.price;\n";
fs.writeFileSync('../sql/m5d-item-ref.sql', out);
fs.writeFileSync('../sql/m5d-run.sql', fs.readFileSync('../sql/m5d-market.sql', 'utf8') + "\n" + out);
console.log(ids.length + " items, " + towns.length + " towns");
