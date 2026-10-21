import { IAreaItem, IRouteItem } from "@/interfaces";

export const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/binhnguyen00/PC08DigitalMap@main/data";

export const SATELLITE_MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&scale=4",
        "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&scale=4",
        "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&scale=4",
        "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&scale=4",
      ],
      tileSize: 256,
      maxzoom: 22,
    },
  },
  layers: [
    {
      id: "satellite-tiles",
      type: "raster",
      source: "satellite",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
} as const;


const DIA_BAN_MODULES = import.meta.glob("/data/DiaBan/**/*.geojson", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const TUYEN_DUONG_MODULES = import.meta.glob("/data/TuyenDuong/**/*.geojson", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const AREA_FILES = Array.from(
  new Set(
    Object.keys(DIA_BAN_MODULES).map((path) => {
      const fileName = path.split("/").pop() || "";
      return fileName.replace(".geojson", "");
    })
  )
).sort((a, b) => a.localeCompare(b, "vi"));

export const DIA_BAN_NAME_MAP: Record<string, string> = {
  AnBien: "An Biên",
  AnDuong: "An Dương",
  AnHai: "An Hải",
  AnPhong: "An Phong",
  AnThanh: "An Thành",
  DongHai: "Đông Hải",
  GiaVien: "Gia Viên",
  HongAn: "Hồng An",
  HongBang: "Hồng Bàng",
  HungDao: "Hưng Đạo",
  KienAn: "Kiến An",
  KimThanh: "Kim Thành",
  LeChan: "Lê Chân",
  NgoQuyen: "Ngô Quyền",
  PhuLien: "Phù Liễn",
  PhuThai: "Phú Thái",
};

export const DIA_BAN_FILES = AREA_FILES;

export const AREA_TEAM_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(DIA_BAN_MODULES).map((path) => {
    const parts = path.split("/");
    const fileName = parts.pop() || "";
    const team = parts.pop() || "";
    return [fileName.replace(".geojson", ""), team];
  })
);

export const ROUTE_FILES = Array.from(
  new Set(
    Object.keys(TUYEN_DUONG_MODULES).map((path) => {
      const fileName = path.split("/").pop() || "";
      return fileName.replace(".geojson", "");
    })
  )
).sort((a, b) => a.localeCompare(b, "vi"));

export async function fetchGeoJson(folder: "DiaBan" | "TuyenDuong", name: string): Promise<any> {
  const modules = folder === "DiaBan" ? DIA_BAN_MODULES : TUYEN_DUONG_MODULES;

  const matchEntry = Object.entries(modules).find(([path]) => {
    const fileName = path.split("/").pop();
    return fileName === `${name}.geojson` || path.endsWith(`/${name}.geojson`) || path.endsWith(`/${name}`);
  });

  const localCandidates: string[] = [];
  const cdnCandidates: string[] = [];

  if (matchEntry) {
    const [path, localUrl] = matchEntry;
    const relativePath = path.replace(/^\/data\//, "");
    localCandidates.push(localUrl);
    cdnCandidates.push(`${CDN_BASE_URL}/${relativePath}`);
  }

  const defaultSubdirs = folder === "DiaBan" ? ["", "Doi1/", "Doi2/", "Doi3/", "Doi4/", "Doi5/"] : [""];
  for (const sub of defaultSubdirs) {
    const local = `/data/${folder}/${sub}${name}.geojson`;
    if (!localCandidates.includes(local)) {
      localCandidates.push(local);
    }
    const cdn = `${CDN_BASE_URL}/${folder}/${sub}${name}.geojson`;
    if (!cdnCandidates.includes(cdn)) {
      cdnCandidates.push(cdn);
    }
  }

  for (const localUrl of localCandidates) {
    try {
      const res = await fetch(`${localUrl}?t=${Date.now()}`, { cache: "no-cache" });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next candidate
    }
  }

  for (const cdnUrl of cdnCandidates) {
    try {
      const cdnRes = await fetch(`${cdnUrl}?t=${Date.now()}`, { cache: "no-cache" });
      if (cdnRes.ok) {
        return await cdnRes.json();
      }
    } catch {
      // Try next candidate
    }
  }

  throw new Error(`Failed to fetch GeoJSON for ${folder}/${name}`);
}

export async function fetchCamerasGeoJson(): Promise<any> {
  const localUrl = `/data/Camera/cameras.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/Camera/cameras.geojson?t=${Date.now()}`;

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
  const localUrl = `/data/Common/haiphong.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/Common/haiphong.geojson?t=${Date.now()}`;

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
  const localUrl = `/data/Common/headquarters.json?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/Common/headquarters.json?t=${Date.now()}`;

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
  return Object.entries(DIA_BAN_MODULES).map(([path]) => {
    const relativePath = path.replace(/^\/data\//, "");
    const fileName = path.split("/").pop() || "";
    const id = fileName.replace(".geojson", "");
    return {
      id,
      name: DIA_BAN_NAME_MAP[id] || id,
      filename: fileName,
      cdnUrl: `${CDN_BASE_URL}/${relativePath}`,
      type: "Area",
    };
  });
}

export const getDiaBanList = getAreaList;

export function getRouteList(): IRouteItem[] {
  return Object.entries(TUYEN_DUONG_MODULES).map(([path]) => {
    const relativePath = path.replace(/^\/data\//, "");
    const fileName = path.split("/").pop() || "";
    const id = fileName.replace(".geojson", "");
    return {
      id,
      name: id,
      filename: fileName,
      cdnUrl: `${CDN_BASE_URL}/${relativePath}`,
      type: "Route",
    };
  });
}

export const getTuyenDuongList = getRouteList;
