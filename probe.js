const bcrypt = require("bcryptjs")

// Known rows
// OLD lic_info: init 2025-10-21, qty 360000, owner 'Any', license_id 1777573127
const oldString = "$2y$10$pzgI8CrYOhuJxrYHhtG1YeUvy2yYchCf26RRsK.bBYRlweqWNGxFC"
// NEW lic_info: init 2026-06-20, qty 1781977228, owner 'Zapatos', license_id 1781977228
const newString = "$2b$10$9i1.J5eEpAOh5W8gsEWjOeZ4Na6ctG9F0ogongBP6ZKMpitwd51ZC"

// lic_code hash from newer dump #1 (id 1)
const code1 = "$2y$10$XwYzhWMaIpudmc.SvBr2XeJgOUMVMFc6Tx71fpBuYZ435eHKJkCmC"
// older lic_code
const oldCode = "$2y$10$Hx/sIukTOqLKBZFnynm3Hua4uH./O1vRfa9uSnXIywcgctY1rGcV."

function norm(h){ return h.replace(/^\$2y\$/,"$2a$").replace(/^\$2b\$/,"$2a$") }

const candidatesOld = [
  "1777573127","Any","2025-10-21","360000",
  "Any1777573127","1777573127Any",
  "2025-10-21360000","3600001777573127",
  "Any2025-10-21360000","Any3600001777573127",
]
const candidatesNew = [
  "1781977228","Zapatos","2026-06-20","1781977228",
  "Zapatos1781977228","1781977228Zapatos",
  "Zapatos2026-06-201781977228",
]

console.log("=== OLD string ===")
for(const c of candidatesOld){
  try { if(bcrypt.compareSync(c, norm(oldString))) console.log("MATCH old:", JSON.stringify(c)) } catch(e){}
}
console.log("=== NEW string ===")
for(const c of candidatesNew){
  try { if(bcrypt.compareSync(c, norm(newString))) console.log("MATCH new:", JSON.stringify(c)) } catch(e){}
}
console.log("done")
