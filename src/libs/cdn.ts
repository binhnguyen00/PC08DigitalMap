import { IAreaItem, IRouteItem } from "@/interfaces";

export const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/binhnguyen00/PC08DigitalMap@main/data";

export const SATELLITE_MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://mt1.google.com/vt/lyrs=y&apistyle=s.t:2|p.v:off&x={x}&y={y}&z={z}",
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
  "QL5",
  "QL10",
  "QL17B",
  "ĐT351",
  "ĐT354",
  "ĐT353",
  "ĐT355",
  "ĐT360",
];

export const TUYEN_DUONG_FILES = ROUTE_FILES;

export async function fetchGeoJson(folder: "DiaBan" | "TuyenDuong", name: string): Promise<any> {
  const localUrl = `/data/${folder}/${name}.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/${folder}/${name}.geojson?t=${Date.now()}`;

  try {
    const res = await fetch(localUrl, { cache: "no-cache" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Local fetch failed for ${localUrl}, falling back to CDN`, err);
  }

  try {
    const cdnRes = await fetch(cdnUrl, { cache: "no-cache" });
    if (cdnRes.ok) {
      return await cdnRes.json();
    }
  } catch (err) {
    console.error(`CDN fetch failed for ${cdnUrl}`, err);
  }

  throw new Error(`Failed to fetch GeoJSON for ${folder}/${name}`);
}

export async function fetchCamerasGeoJson(): Promise<any> {
  const localUrl = `/data/cameras.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/cameras.geojson?t=${Date.now()}`;

  try {
    const res = await fetch(localUrl, { cache: "no-cache" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Local fetch failed for ${localUrl}, falling back to CDN`, err);
  }

  try {
    const cdnRes = await fetch(cdnUrl, { cache: "no-cache" });
    if (cdnRes.ok) {
      return await cdnRes.json();
    }
  } catch (err) {
    console.error(`CDN fetch failed for ${cdnUrl}`, err);
  }

  throw new Error(`Failed to fetch GeoJSON for cameras`);
}

export async function fetchHaiphongGeoJson(): Promise<any> {
  const localUrl = `/data/haiphong.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/haiphong.geojson?t=${Date.now()}`;

  try {
    const res = await fetch(localUrl, { cache: "no-cache" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Local fetch failed for ${localUrl}, falling back to CDN`, err);
  }

  try {
    const cdnRes = await fetch(cdnUrl, { cache: "no-cache" });
    if (cdnRes.ok) {
      return await cdnRes.json();
    }
  } catch (err) {
    console.error(`CDN fetch failed for ${cdnUrl}`, err);
  }

  throw new Error(`Failed to fetch GeoJSON for Hải Phòng`);
}

export interface IHeadquarter {
  id: number;
  name: string;
  lng: number;
  lat: number;
}

export async function fetchHeadquarters(): Promise<IHeadquarter[]> {
  const localUrl = `/data/headquarters.json?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/headquarters.json?t=${Date.now()}`;

  try {
    const res = await fetch(localUrl, { cache: "no-cache" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Local fetch failed for ${localUrl}, falling back to CDN`, err);
  }

  try {
    const cdnRes = await fetch(cdnUrl, { cache: "no-cache" });
    if (cdnRes.ok) {
      return await cdnRes.json();
    }
  } catch (err) {
    console.error(`CDN fetch failed for ${cdnUrl}`, err);
  }

  throw new Error(`Failed to fetch headquarters data`);
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
