import { IAreaItem, IRouteItem } from "@/interfaces";

export const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/binhnguyen00/PC08DigitalMap@main/data";

export const SATELLITE_MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "satellite-tiles",
      type: "raster",
      source: "satellite",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
} as const;


export const AREA_FILES = [
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

export const DIA_BAN_FILES = AREA_FILES;

export const ROUTE_FILES = [
  "QL17B",
  "QL5",
  "ĐT355",
];

export const TUYEN_DUONG_FILES = ROUTE_FILES;

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

export function getAreaList(): IAreaItem[] {
  return AREA_FILES.map((name) => ({
    id: name,
    name: name,
    filename: `${name}.geojson`,
    cdnUrl: `${CDN_BASE_URL}/DiaBan/${name}.geojson`,
    type: "Area",
  }));
}

export const getDiaBanList = getAreaList;

export function getRouteList(): IRouteItem[] {
  return ROUTE_FILES.map((name) => ({
    id: name,
    name: name,
    filename: `${name}.geojson`,
    cdnUrl: `${CDN_BASE_URL}/TuyenDuong/${name}.geojson`,
    type: "Route",
  }));
}

export const getTuyenDuongList = getRouteList;
