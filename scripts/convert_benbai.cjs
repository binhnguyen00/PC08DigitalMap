const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/BenBai/list.xlsx");
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets["Bến Bãi"];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

function cleanPhone(val) {
  if (!val) return "";
  let s = String(val).trim();
  if (/^\d{9}$/.test(s)) s = "0" + s;
  return s;
}

function formatExpiry(val) {
  if (!val) return "";
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(val).trim();
}

function classifyType(raw) {
  if (!raw) return "Khác / Bến tạm";
  const s = raw.toLowerCase().trim();
  if (s.includes("đóng tàu") || s.includes("sửa chữa tàu") || s.includes("cơ khí đóng mới")) return "Đóng tàu, cơ khí";
  if (s.includes("than") || s.includes("xít")) return "Than, khoáng sản";
  if (s.includes("vlxd") || s.includes("vật liệu xây") || s.includes("cát") || s.includes("đá") || s.includes("gạch") || s.includes("mỏ đất")) return "Vật liệu xây dựng";
  if (s.includes("cảng")) return "Cảng thủy nội địa";
  if (s.includes("hàng hóa") || s.includes("hàng hoá") || s.includes("xếp dỡ")) return "Bến hàng hóa";
  return "Khác / Bến tạm";
}

const features = [];
let unmappedCount = 0;

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;

  const stt = row[0] || i;
  const name = (row[1] || "").toString().trim();
  const phone = cleanPhone(row[2]);
  const owner = (row[3] || "").toString().trim();
  const ownerPhone = cleanPhone(row[4]);
  const location = (row[5] || "").toString().trim();
  const rawType = (row[6] || "").toString().trim();
  const category = classifyType(rawType);

  const materialsSand = (row[7] || "").toString().trim();
  const materialsMineral = (row[8] || "").toString().trim();
  const materialsOther = (row[9] || "").toString().trim();

  const permitNumber = (row[10] || "").toString().trim();
  let permitStatus = "Không xác định";
  if (row[11] && row[11].toString().toLowerCase().includes("x")) permitStatus = "Có phép";
  else if (row[12] && row[12].toString().toLowerCase().includes("x")) permitStatus = "Không phép";
  else if (row[13] && row[13].toString().toLowerCase().includes("x")) permitStatus = "Hết phép";

  const permitExpiry = formatExpiry(row[14]);

  const officerName = (row[15] || "").toString().trim();
  const officerPhone = cleanPhone(row[16]);
  const commanderName = (row[17] || "").toString().trim();
  const commanderPhone = cleanPhone(row[18]);
  const leaderName = (row[19] || "").toString().trim();
  const leaderPhone = cleanPhone(row[20]);

  const coordStr = (row[21] || "").toString().trim();
  const link = (row[22] || "").toString().trim();

  let operatingStatus = "Không xác định";
  if (row[23] && row[23].toString().toLowerCase().includes("x")) operatingStatus = "Đang hoạt động";
  else if (row[24] && row[24].toString().toLowerCase().includes("x")) operatingStatus = "Dừng hoạt động";

  const managementUnit = (row[25] || "").toString().trim().replace(/\s*-\s*/g, "-");
  let managementTeam = "Chưa gán đơn vị";
  if (managementUnit.startsWith("Bạch Đằng")) managementTeam = "Bạch Đằng";
  else if (managementUnit.startsWith("ĐT1")) managementTeam = "ĐT1";
  else if (managementUnit.startsWith("ĐT2")) managementTeam = "ĐT2";

  let coordinates = null;
  if (coordStr && coordStr.includes(",")) {
    const parts = coordStr.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      coordinates = [parts[1], parts[0]];
    }
  }

  if (!coordinates) {
    unmappedCount++;
    continue;
  }

  features.push({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: coordinates,
    },
    properties: {
      id: stt,
      stt,
      name,
      phone,
      owner,
      ownerPhone,
      location,
      rawType,
      category,
      materialsSand,
      materialsMineral,
      materialsOther,
      permitNumber,
      permitStatus,
      permitExpiry,
      officerName,
      officerPhone,
      commanderName,
      commanderPhone,
      leaderName,
      leaderPhone,
      originalLink: link,
      operatingStatus,
      managementUnit,
      managementTeam,
      coordinatesStr: `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`,
    },
  });
}

const geojson = {
  type: "FeatureCollection",
  features: features,
};

const outputPath = path.join(__dirname, "../data/BenBai/benbai.geojson");
fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), "utf8");

console.log(`Converted ${features.length} mapped points to ${outputPath} (${unmappedCount} unmapped)`);
