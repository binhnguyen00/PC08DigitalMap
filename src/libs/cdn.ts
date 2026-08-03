import { IDiaBanItem, ITuyenDuongItem } from "@/interfaces";

export const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/binhnguyen00/PC08DigitalMap@main/data";

export const DIA_BAN_FILES = [
  "AnBien",
  "AnDuong",
  "AnHai",
  "AnPhong",
  "AnThanh",
  "GiaVien",
  "HongAn",
  "HongBang",
  "HungDao",
  "KienAn",
  "KimThanh",
  "LeChan",
  "NgoQuyen",
  "PhuLien",
  "PhuThai",
];

export const TUYEN_DUONG_FILES = [
  "QL17B",
  "QL5",
  "ĐT355",
];

export async function fetchGeoJson(folder: "DiaBan" | "TuyenDuong", name: string): Promise<any> {
  const cdnUrl = `${CDN_BASE_URL}/${folder}/${name}.geojson`;
  const localUrl = `/data/${folder}/${name}.geojson`;

  try {
    const res = await fetch(cdnUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`CDN fetch failed for ${cdnUrl}, falling back to local`, err);
  }

  const localRes = await fetch(localUrl);
  if (!localRes.ok) {
    throw new Error(`Failed to fetch GeoJSON for ${folder}/${name}`);
  }
  return await localRes.json();
}

export function getDiaBanList(): IDiaBanItem[] {
  return DIA_BAN_FILES.map((name) => ({
    id: name,
    name: name,
    filename: `${name}.geojson`,
    cdnUrl: `${CDN_BASE_URL}/DiaBan/${name}.geojson`,
    type: "DiaBan",
  }));
}

export function getTuyenDuongList(): ITuyenDuongItem[] {
  return TUYEN_DUONG_FILES.map((name) => ({
    id: name,
    name: name,
    filename: `${name}.geojson`,
    cdnUrl: `${CDN_BASE_URL}/TuyenDuong/${name}.geojson`,
    type: "TuyenDuong",
  }));
}
