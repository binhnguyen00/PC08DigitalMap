import { IAreaItem, IRouteItem } from "@/interfaces";

export const CDN_BASE_URL = "https://cdn.jsdelivr.net/gh/binhnguyen00/PC08DigitalMap@main/data";

export const SATELLITE_MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=4&apistyle=s.t%3A0%7Cs.e%3Al%7Cp.v%3Aoff%2Cs.t%3A1%7Cp.v%3Aoff%2Cs.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff%2Cs.t%3A3%7Cs.e%3Al%7Cp.v%3Aon%2Cs.t%3A0%7Cp.s%3A-100",
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=4&apistyle=s.t%3A0%7Cs.e%3Al%7Cp.v%3Aoff%2Cs.t%3A1%7Cp.v%3Aoff%2Cs.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff%2Cs.t%3A3%7Cs.e%3Al%7Cp.v%3Aon%2Cs.t%3A0%7Cp.s%3A-100",
        "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=4&apistyle=s.t%3A0%7Cs.e%3Al%7Cp.v%3Aoff%2Cs.t%3A1%7Cp.v%3Aoff%2Cs.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff%2Cs.t%3A3%7Cs.e%3Al%7Cp.v%3Aon%2Cs.t%3A0%7Cp.s%3A-100",
        "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=4&apistyle=s.t%3A0%7Cs.e%3Al%7Cp.v%3Aoff%2Cs.t%3A1%7Cp.v%3Aoff%2Cs.t%3A2%7Cp.v%3Aoff%2Cs.t%3A4%7Cp.v%3Aoff%2Cs.t%3A3%7Cs.e%3Al%7Cp.v%3Aon%2Cs.t%3A0%7Cp.s%3A-100",
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
      paint: {
        "raster-saturation": -1,
      },
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

const TUYEN_SONG_MODULES = import.meta.glob("/data/TuyenSong/**/*.geojson", {
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

export async function fetchBenBaiGeoJson(): Promise<any> {
  const localUrl = `/data/BenBai/benbai.geojson?t=${Date.now()}`;
  const cdnUrl = `${CDN_BASE_URL}/BenBai/benbai.geojson?t=${Date.now()}`;

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

  throw new Error(`Failed to fetch GeoJSON for bến bãi`);
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
      name: id,
      filename: fileName,
      cdnUrl: `${CDN_BASE_URL}/${relativePath}`,
      type: "Area",
    };
  });
}

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

export async function fetchTuyenSongGeoJson(): Promise<any> {
  const allFeatures: any[] = [];
  const entries = Object.entries(TUYEN_SONG_MODULES);

  await Promise.all(
    entries.map(async ([path, localUrl]) => {
      const pathParts = path.split("/");
      const rawFileName = pathParts.pop() || "";
      const riverName = rawFileName.replace(/\.geojson$/i, "");
      const folderName = pathParts.pop() || "";
      const lowerFolder = folderName.toLowerCase();

      let managementTeam = "Chưa gán đơn vị";
      if (lowerFolder.includes("bạch đằng") || lowerFolder.includes("bach dang") || lowerFolder.includes("trạm")) {
        managementTeam = "Bạch Đằng";
      } else if (lowerFolder.includes("số 1") || lowerFolder.includes("so 1") || lowerFolder.includes("đt1") || lowerFolder.includes("doi1")) {
        managementTeam = "ĐT1";
      } else if (lowerFolder.includes("số 2") || lowerFolder.includes("so 2") || lowerFolder.includes("đt2") || lowerFolder.includes("doi2")) {
        managementTeam = "ĐT2";
      }

      const defaultDisplayName = /^(sông|kênh|lạch|ngòi|suối|cửa)\s/i.test(riverName)
        ? riverName
        : `Sông ${riverName}`;

      const relativePath = path
        .replace(/^\/data\//, "")
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const cdnUrl = `${CDN_BASE_URL}/${relativePath}?t=${Date.now()}`;
      const localFetchUrl = `${localUrl}${localUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

      let rawData: any = null;
      try {
        const localResponse = await fetch(localFetchUrl, { cache: "no-cache" });
        if (localResponse.ok) {
          rawData = await localResponse.json();
        }
      } catch {
        // Fallback to CDN
      }

      if (!rawData) {
        try {
          const cdnResponse = await fetch(cdnUrl, { cache: "no-cache" });
          if (cdnResponse.ok) {
            rawData = await cdnResponse.json();
          }
        } catch (error) {
          console.error(`Failed to fetch TuyenSong GeoJSON for ${path}`, error);
        }
      }

      if (!rawData) return;

      if (rawData.type === "FeatureCollection" && Array.isArray(rawData.features)) {
        for (const feature of rawData.features) {
          if (!feature?.geometry) continue;
          allFeatures.push({
            type: "Feature",
            id: feature.id || `${managementTeam}-${riverName}-${allFeatures.length}`,
            properties: {
              ...feature.properties,
              name: feature.properties?.name || feature.properties?.ten_song || defaultDisplayName,
              riverName,
              managementTeam,
              managementUnit: folderName,
            },
            geometry: feature.geometry,
          });
        }
        return;
      }

      if (rawData.type === "Feature" && rawData.geometry) {
        allFeatures.push({
          type: "Feature",
          id: rawData.id || `${managementTeam}-${riverName}-${allFeatures.length}`,
          properties: {
            ...rawData.properties,
            name: rawData.properties?.name || rawData.properties?.ten_song || defaultDisplayName,
            riverName,
            managementTeam,
            managementUnit: folderName,
          },
          geometry: rawData.geometry,
        });
        return;
      }

      if (Array.isArray(rawData.elements)) {
        const nodeMap = new Map<number, [number, number]>();
        for (const element of rawData.elements) {
          if (element.type === "node" && typeof element.lon === "number" && typeof element.lat === "number") {
            nodeMap.set(element.id, [element.lon, element.lat]);
          }
        }

        for (const element of rawData.elements) {
          if (element.type === "way") {
            let coordinates: [number, number][] = [];
            if (Array.isArray(element.geometry)) {
              coordinates = element.geometry
                .filter((point: any) => point && typeof point.lon === "number" && typeof point.lat === "number")
                .map((point: any) => [point.lon, point.lat] as [number, number]);
            } else if (Array.isArray(element.nodes)) {
              coordinates = element.nodes
                .map((nodeId: number) => nodeMap.get(nodeId))
                .filter((coordinate: [number, number] | undefined): coordinate is [number, number] => Boolean(coordinate));
            }

            if (coordinates.length >= 2) {
              allFeatures.push({
                type: "Feature",
                id: element.id || `${managementTeam}-${riverName}-${allFeatures.length}`,
                properties: {
                  ...element.tags,
                  id: element.id,
                  name: element.tags?.name || defaultDisplayName,
                  riverName,
                  managementTeam,
                  managementUnit: folderName,
                },
                geometry: {
                  type: "LineString",
                  coordinates,
                },
              });
            }
          } else if (element.type === "relation" && Array.isArray(element.members)) {
            const multiLineCoordinates: [number, number][][] = [];
            for (const member of element.members) {
              if (Array.isArray(member.geometry)) {
                const lineCoordinates = member.geometry
                  .filter((point: any) => point && typeof point.lon === "number" && typeof point.lat === "number")
                  .map((point: any) => [point.lon, point.lat] as [number, number]);
                if (lineCoordinates.length >= 2) {
                  multiLineCoordinates.push(lineCoordinates);
                }
              }
            }
            if (multiLineCoordinates.length > 0) {
              allFeatures.push({
                type: "Feature",
                id: element.id || `${managementTeam}-${riverName}-${allFeatures.length}`,
                properties: {
                  ...element.tags,
                  id: element.id,
                  name: element.tags?.name || defaultDisplayName,
                  riverName,
                  managementTeam,
                  managementUnit: folderName,
                },
                geometry: {
                  type: "MultiLineString",
                  coordinates: multiLineCoordinates,
                },
              });
            }
          }
        }
      }
    })
  );

  return {
    type: "FeatureCollection",
    features: allFeatures,
  };
}
