import { useMany } from "@refinedev/core";
import { FloatButton, Spin, Typography } from "antd";
import type * as GeoJSON from "geojson";
import React from "react";

import { Map, MapControls, MapFullscreenTitle, MapGeoJSON, MapMarker, MapPopup, MapRef, MarkerContent } from "@/components/map";
import { IAreaItem, IRouteItem } from "@/interfaces";
import { AREA_FILES, AREA_TEAM_MAP, ROUTE_FILES, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import { CompassOutlined, LoadingOutlined, ReloadOutlined } from "@ant-design/icons";

interface IHoverInfo {
  type: "area" | "route";
  feature: GeoJSON.Feature;
  longitude: number;
  latitude: number;
  color?: string;
}

const TEAMS = [
  { id: "Doi1", label: "ĐỘI 1", color: "#38bdf8" },
  { id: "Doi2", label: "ĐỘI 2", color: "#facc15" },
  { id: "Doi3", label: "ĐỘI 3", color: "#4ade80" },
  { id: "Doi4", label: "ĐỘI 4", color: "#a78bfa" },
  { id: "Doi5", label: "ĐỘI 5", color: "#f472b6" },
];

const DEFAULT_AREA_COLOR = "#94a3b8";

const TEAM_AREA_COUNTS: Record<string, number> = Object.values(AREA_TEAM_MAP).reduce(
  (counts, team) => ({ ...counts, [team]: (counts[team] || 0) + 1 }),
  {} as Record<string, number>
);

const ORANGE = "#FC4C02";

const ROUTE_COLORS: Record<string, string> = {
  QL5: ORANGE,
  QL10: ORANGE,
  QL17B: ORANGE,
  ĐT351: ORANGE,
  ĐT354: ORANGE,
  ĐT355: ORANGE,
  ĐT360: ORANGE,
};

const renderTruSoLink = (truSo: any) => {
  if (!truSo) return null;

  let lat: number | null = null;
  let lng: number | null = null;

  if (Array.isArray(truSo) && truSo.length === 2) {
    let n1 = Number(truSo[0]);
    let n2 = Number(truSo[1]);
    if (!isNaN(n1) && !isNaN(n2)) {
      if (n1 > 90) {
        lat = n2;
        lng = n1;
      } else {
        lat = n1;
        lng = n2;
      }
    }
  } else if (typeof truSo === "string") {
    const cleanStr = truSo.replace(/[\[\]]/g, "").trim();
    const parts = cleanStr.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      let n1 = Number(parts[0]);
      let n2 = Number(parts[1]);
      if (!isNaN(n1) && !isNaN(n2)) {
        if (n1 > 90) {
          lat = n2;
          lng = n1;
        } else {
          lat = n1;
          lng = n2;
        }
      }
    }
  }

  if (lat !== null && lng !== null && lat !== 0 && lng !== 0) {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
      <Typography.Link
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400! hover:text-blue-300! font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3 shrink-0 fill-[#EA4335]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
        </svg>
        <span className="text-xs">Google Maps</span>
      </Typography.Link>
    );
  }

  return <Typography.Text className="font-semibold text-white!">{String(truSo)}</Typography.Text>;
};

function getGeometryCenter(geometry: any): [number, number] | null {
  if (!geometry) return null;

  const getRingArea = (ring: number[][]): number => {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      area += (xj + xi) * (yj - yi);
    }
    return Math.abs(area / 2);
  };

  const getRingCentroid = (ring: number[][]): [number, number] => {
    let cx = 0;
    let cy = 0;
    let signedArea = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const a = xi * yj - xj * yi;
      signedArea += a;
      cx += (xi + xj) * a;
      cy += (yi + yj) * a;
    }
    signedArea *= 0.5;
    if (Math.abs(signedArea) > 1e-9) {
      return [cx / (6 * signedArea), cy / (6 * signedArea)];
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  };

  if (geometry.type === "Polygon" && geometry.coordinates?.[0]) {
    return getRingCentroid(geometry.coordinates[0]);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    let maxArea = -1;
    let bestCentroid: [number, number] | null = null;
    for (const poly of geometry.coordinates) {
      if (poly?.[0]) {
        const area = getRingArea(poly[0]);
        if (area > maxArea) {
          maxArea = area;
          bestCentroid = getRingCentroid(poly[0]);
        }
      }
    }
    return bestCentroid;
  }

  return null;
}

export const ManagementAreaPage: React.FC = () => {
  const mapRef = React.useRef<MapRef>(null);

  const { query: areaQuery } = useMany<IAreaItem>({
    resource: "areas",
    ids: AREA_FILES,
  });

  const { query: routeQuery } = useMany<IRouteItem>({
    resource: "routes",
    ids: ROUTE_FILES,
  });

  const [selectedFeature, setSelectedFeature] = React.useState<IHoverInfo | null>(null);

  const areaItems = React.useMemo<IAreaItem[]>(() => areaQuery?.data?.data || [], [areaQuery?.data]);
  const routeItems = React.useMemo<IRouteItem[]>(() => routeQuery?.data?.data || [], [routeQuery?.data]);

  const areaCentersGeoJson = React.useMemo(() => {
    const features: any[] = [];

    for (const item of areaItems) {
      if (!item.rawJson) continue;

      const rawFeatures =
        item.rawJson.features ||
        (item.rawJson.type === "Feature" ? [item.rawJson] : []);

      for (const feat of rawFeatures) {
        const center = getGeometryCenter(feat.geometry);
        if (center) {
          features.push({
            type: "Feature",
            id: feat.id || item.id,
            properties: {
              ...feat.properties,
              team: AREA_TEAM_MAP[item.id] || "",
              ten_xa: feat.properties?.ten_xa || feat.properties?.name || item.name || item.id,
            },
            geometry: {
              type: "Point",
              coordinates: center,
            },
          });
          break;
        }
      }
    }

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [areaItems]);

  const teamCentersGeoJson = React.useMemo(() => {
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    };

    const features = TEAMS.flatMap((team) => {
      const points = areaCentersGeoJson.features
        .filter((feature) => feature.properties.team === team.id)
        .map((feature) => feature.geometry.coordinates as [number, number]);
      if (points.length === 0) return [];
      return [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Point" as const,
            coordinates: [median(points.map((point) => point[0])), median(points.map((point) => point[1]))],
          },
        },
      ];
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [areaCentersGeoJson]);

  const activePopupInfo = selectedFeature;
  const activeProperties = activePopupInfo?.feature?.properties;

  const selectedHqCoords = React.useMemo(() => {
    const feat = selectedFeature?.feature;
    if (!feat?.properties) return null;
    const props = feat.properties;
    const truSo = props.tru_so;

    let lat: number | null = null;
    let lng: number | null = null;

    if (Array.isArray(truSo) && truSo.length === 2) {
      let n1 = Number(truSo[0]);
      let n2 = Number(truSo[1]);
      if (!isNaN(n1) && !isNaN(n2)) {
        if (n1 > 90) {
          lat = n2;
          lng = n1;
        } else {
          lat = n1;
          lng = n2;
        }
      }
    } else if (typeof truSo === "string") {
      const cleanStr = truSo.replace(/[\[\]]/g, "").trim();
      const parts = cleanStr.split(",").map((s) => s.trim());
      if (parts.length === 2) {
        let n1 = Number(parts[0]);
        let n2 = Number(parts[1]);
        if (!isNaN(n1) && !isNaN(n2)) {
          if (n1 > 90) {
            lat = n2;
            lng = n1;
          } else {
            lat = n1;
            lng = n2;
          }
        }
      }
    }

    if (lat !== null && lng !== null && lat !== 0 && lng !== 0) {
      return {
        ten_xa: props.ten_xa || props.name || "",
        latitude: lat,
        longitude: lng,
      };
    }
    return null;
  }, [selectedFeature]);

  const handleRefetch = () => {
    areaQuery.refetch();
    routeQuery.refetch();
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden">
      <div className="flex-1 w-full h-full relative">
        {(areaQuery.isLoading || routeQuery.isLoading) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
            <Spin
              size="large"
              description={<span className="text-white font-medium mt-2 block">Đang tải dữ liệu bản đồ...</span>}
            />
          </div>
        )}
        <Map
          ref={mapRef}
          viewport={{
            center: [106.61860442940119, 20.848955740022355],
            zoom: 11,
          }}
          minZoom={1}
          maxZoom={16}
          styles={{
            light: SATELLITE_MAP_STYLE as any,
            dark: SATELLITE_MAP_STYLE as any,
          }}
        >
          <MapControls position="top-right" showFullscreen showExport showLocate />
          <MapFullscreenTitle />

          {/* Area polygon layers */}
          {areaItems.map((item: IAreaItem) => {
            if (!item.rawJson) return null;

            const team = TEAMS.find((teamItem) => teamItem.id === AREA_TEAM_MAP[item.id]);
            const color = team?.color || DEFAULT_AREA_COLOR;

            return (
              <MapGeoJSON
                key={`area-${item.id}`}
                id={`area-${item.id}`}
                data={item.rawJson}
                promoteId="ma_xa"
                interactive
                fillPaint={{
                  "fill-color": color,
                  "fill-opacity": 0.45,
                }}
                fillHoverPaint={{
                  "fill-opacity": 0.75,
                }}
                linePaint={{
                  "line-color": "#ffffff",
                  "line-width": 1,
                  "line-opacity": 0.9,
                }}
                symbolLayout={{
                  "text-size": 10,
                  "text-font": ["Open Sans Regular"],
                }}
                onClick={(e: any) => {
                  setSelectedFeature({
                    type: "area",
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                    color,
                  });
                }}
              />
            );
          })}

          {/* Route line layers */}
          {routeItems.map((item: IRouteItem) => {
            if (!item.rawJson) return null;

            const color = ROUTE_COLORS[item.id] || ORANGE;

            const formattedGeoJSON = {
              ...item.rawJson,
              features: item.rawJson.features?.map((f: any) => ({
                ...f,
                properties: {
                  ...f.properties,
                  ten_tuyen: f.properties?.ten_tuyen || f.properties?.name || item.id,
                },
              })),
            };

            return (
              <MapGeoJSON
                key={`route-${item.id}`}
                id={`route-${item.id}`}
                data={formattedGeoJSON}
                interactive
                fillPaint={false}
                lineCasingPaint={{
                  "line-color": "#0f172a",
                  "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    8,
                    2.0,
                    10,
                    3.4,
                    12,
                    4.2,
                    14,
                    5.2,
                    16,
                    6.5,
                  ],
                  "line-opacity": 1,
                }}
                linePaint={{
                  "line-color": color,
                  "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    8,
                    1.2,
                    10,
                    2.2,
                    12,
                    2.8,
                    14,
                    3.6,
                    16,
                    4.6,
                  ],
                  "line-opacity": 1,
                }}
                labelProperty="ten_tuyen"
                symbolLayout={{
                  "symbol-placement": "line",
                  "icon-image": "route-shield-blue",
                  "icon-text-fit": "both",
                  "icon-text-fit-padding": [0.5, 2, 0.5, 2],
                  "icon-allow-overlap": false,
                  "icon-ignore-placement": false,
                  "text-field": ["coalesce", ["get", "ten_tuyen"], ["get", "name"], ""],
                  "text-size": 5.5,
                  "text-font": ["Open Sans Regular"],
                  "text-allow-overlap": false,
                  "text-ignore-placement": false,
                  "text-keep-upright": true,
                  "text-max-angle": 75,
                  "symbol-spacing": 220,
                }}
                symbolPaint={{
                  "text-color": "#ffffff",
                  "text-halo-width": 0,
                  "text-halo-color": "transparent",
                }}
                onClick={(e: any) => {
                  setSelectedFeature({
                    type: "route",
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                    color: color,
                  });
                }}
              />
            );
          })}

          {/* Area center star & label layer (single center point per area) */}
          {areaCentersGeoJson.features.length > 0 && (
            <MapGeoJSON
              id="area-label-centers"
              data={areaCentersGeoJson}
              fillPaint={false}
              linePaint={false}
              labelProperty="ten_xa"
              symbolLayout={{
                "icon-image": "star-icon",
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  0.3,
                  11,
                  0.38,
                  13,
                  0.48,
                  15,
                  0.6,
                ],
                "icon-allow-overlap": false,
                "icon-ignore-placement": false,
                "icon-anchor": "center",
                "text-field": ["coalesce", ["get", "ten_xa"], ["get", "name"], ""],
                "text-variable-anchor": ["left", "right", "top", "bottom"],
                "text-radial-offset": 0.5,
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  6.5,
                  11,
                  7.5,
                  13,
                  9.5,
                  15,
                  12,
                ],
                "text-font": ["Open Sans Regular"],
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-optional": true,
                "text-padding": 3,
              }}
              symbolPaint={{
                "text-color": "#ffffff",
                "text-halo-color": "rgba(15, 23, 42, 0.9)",
                "text-halo-width": 1.5,
                "text-halo-blur": 0.5,
              }}
            />
          )}

          {/* Team name labels at team center */}
          {teamCentersGeoJson.features.length > 0 && (
            <MapGeoJSON
              id="team-label-centers"
              data={teamCentersGeoJson}
              fillPaint={false}
              linePaint={false}
              labelProperty="label"
              symbolLayout={{
                "text-field": ["get", "label"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 8, 12, 11, 20, 14, 26],
                "text-font": ["Open Sans Regular"],
                "text-allow-overlap": true,
                "text-ignore-placement": true,
                "text-justify": "center",
                "text-anchor": "center",
              }}
              symbolPaint={{
                "text-color": "#0f172a",
                "text-halo-color": "rgba(255, 255, 255, 0.95)",
                "text-halo-width": 2.5,
              }}
            />
          )}

          {/* Selected Headquarters Star Marker (only shown on click, clicking star has NO popup) */}
          {selectedHqCoords && (
            <MapMarker
              key={`selected-hq-${selectedHqCoords.latitude}-${selectedHqCoords.longitude}`}
              longitude={selectedHqCoords.longitude}
              latitude={selectedHqCoords.latitude}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MarkerContent className="z-40 pointer-events-auto">
                <div
                  className="flex flex-col items-center justify-center cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps?q=${selectedHqCoords.latitude},${selectedHqCoords.longitude}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  title="Mở Google Maps"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#facc15"
                    stroke="#78350f"
                    strokeWidth="1.5"
                    className="w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-125"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="mt-0.5 text-[11px] font-bold text-slate-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] whitespace-nowrap bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded border border-white/15 transition-colors group-hover:bg-black/75">
                    Trụ sở {selectedHqCoords.ten_xa}
                  </span>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {activePopupInfo && (
            <MapPopup
              longitude={selectedHqCoords ? selectedHqCoords.longitude : activePopupInfo.longitude}
              latitude={selectedHqCoords ? selectedHqCoords.latitude : activePopupInfo.latitude}
              onClose={() => setSelectedFeature(null)}
              closeButton
              closeOnClick={false}
              className="z-30 w-48"
              offset={24}
            >
              <div className="text-zinc-100 w-full flex flex-col gap-1.5">
                {activePopupInfo.type === "area" ? (
                  <>
                    <div className="font-bold border-b border-white/10 pb-1.5 pr-4 flex items-center gap-1.5">
                      {activePopupInfo.color && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0 border border-white/20"
                          style={{
                            backgroundColor: activePopupInfo.color,
                            boxShadow: `0 0 6px ${activePopupInfo.color}80`,
                          }}
                        />
                      )}
                      <span className="text-[12px] truncate" title={activeProperties?.ten_xa || activeProperties?.name || "Thông tin địa bàn"}>
                        {activeProperties?.ten_xa || activeProperties?.name || "Thông tin"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      {activeProperties?.dtich_km2 !== undefined && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400">Diện tích</span>
                          <span className="font-medium text-zinc-100">{activeProperties.dtich_km2} km²</span>
                        </div>
                      )}
                      {activeProperties?.dan_so !== undefined && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400">Dân số</span>
                          <span className="font-medium text-zinc-100">
                            {Number(activeProperties.dan_so).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      )}
                      {activeProperties?.tru_so && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400">Trụ sở</span>
                          {renderTruSoLink(activeProperties.tru_so)}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold border-b border-white/10 pb-1.5 pr-4 flex items-center gap-1.5">
                      {activePopupInfo.color && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0 border border-white/20"
                          style={{
                            backgroundColor: activePopupInfo.color,
                            boxShadow: `0 0 6px ${activePopupInfo.color}80`,
                          }}
                        />
                      )}
                      <span className="text-[12px] truncate" title={activeProperties?.ten_tuyen || activeProperties?.name || "Tuyến đường"}>
                        {activeProperties?.ten_tuyen || activeProperties?.name || "Tuyến đường"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      {activeProperties?.chieu_dai && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400">Chiều dài</span>
                          <span className="font-medium text-zinc-100">{activeProperties.chieu_dai} km</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </MapPopup>
          )}
        </Map>

        <FloatButton.Group
          shape="circle"
          style={{ right: 24, bottom: 24 }}
        >
          <FloatButton
            icon={<CompassOutlined />}
            tooltip="Xem toàn cảnh"
            onClick={() => {
              mapRef.current?.flyTo({
                center: [106.61860442940119, 20.848955740022355],
                zoom: 11,
                duration: 1000,
              });
            }}
          />
          <FloatButton
            icon={(areaQuery.isFetching || routeQuery.isFetching) ? <LoadingOutlined /> : <ReloadOutlined />}
            tooltip="Tải lại dữ liệu"
            onClick={handleRefetch}
          />
        </FloatButton.Group>
      </div>
    </div>
  );
};
