import { useMany } from "@refinedev/core";
import { Badge, Button, Input, Spin } from "antd";
import type * as GeoJSON from "geojson";
import React from "react";

import { Map, MapControls, MapGeoJSON, MapMarker, MarkerContent, MapPopup, MapRef, MapFullscreenTitle, MapLegend } from "@/components/map";
import { IAreaItem } from "@/interfaces";
import { AREA_FILES, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import { cn } from "@/libs/tailwind";

interface IHoverInfo {
  feature: GeoJSON.Feature;
  longitude: number;
  latitude: number;
}

const DISTRICT_COLORS: Record<string, string> = {
  AnBien: "#3b82f6",
  AnDuong: "#ef4444",
  AnHai: "#10b981",
  AnPhong: "#f59e0b",
  AnThanh: "#8b5cf6",
  GiaVien: "#ec4899",
  HongAn: "#06b6d4",
  HongBang: "#84cc16",
  HungDao: "#14b8a6",
  KienAn: "#f97316",
  KimThanh: "#6366f1",
  LeChan: "#d97706",
  NgoQuyen: "#0284c7",
  PhuLien: "#65a30d",
  PhuThai: "#7c3aed",
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
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <span>{`${lat}, ${lng}`}</span>
        <svg className="w-3 h-3 shrink-0 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return <span className="font-semibold">{String(truSo)}</span>;
};

export const AreaPage: React.FC = () => {
  const mapRef = React.useRef<MapRef>(null);

  const { query } = useMany<IAreaItem>({
    resource: "areas",
    ids: AREA_FILES,
  });

  const isLoading = query.isLoading;
  const refetch = query.refetch;

  const [hiddenItems, setHiddenItems] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFeature, setSelectedFeature] = React.useState<IHoverInfo | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<IHoverInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const items = React.useMemo<IAreaItem[]>(() => query?.data?.data || [], [query?.data]);

  const toggleVisibility = React.useCallback((id: string) => {
    setHiddenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const toggleAllVisibility = React.useCallback((show: boolean) => {
    setHiddenItems(() => {
      const next: Record<string, boolean> = {};
      if (!show) {
        for (const name of AREA_FILES) {
          next[name] = true;
        }
      }
      return next;
    });
  }, []);

  const flyToArea = React.useCallback((name: string) => {
    const item = items.find((i: IAreaItem) => i.id === name);
    if (!item?.rawJson || !mapRef.current) return;

    try {
      const coords: [number, number][] = [];
      const extractCoords = (geometry: any) => {
        if (!geometry?.coordinates) return;
        if (geometry.type === "Polygon") {
          geometry.coordinates[0]?.forEach((pt: [number, number]) => coords.push(pt));
        } else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((poly: any) => {
            poly[0]?.forEach((pt: [number, number]) => coords.push(pt));
          });
        }
      };

      for (const feat of item.rawJson.features || []) {
        extractCoords(feat.geometry);
      }

      if (coords.length > 0) {
        let minLng = coords[0][0];
        let maxLng = coords[0][0];
        let minLat = coords[0][1];
        let maxLat = coords[0][1];

        for (const [lng, lat] of coords) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }

        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 60, duration: 1200 }
        );
      }
    } catch (e) {
      console.warn("Could not calculate bounds for flyTo", e);
    }
  }, [items]);

  const filteredNames = React.useMemo(() => {
    if (!searchQuery.trim()) return AREA_FILES;
    const queryStr = searchQuery.toLowerCase();
    return AREA_FILES.filter((name: string) => {
      if (name.toLowerCase().includes(queryStr)) return true;
      const item = items.find((i: IAreaItem) => i.id === name);
      if (item?.rawJson) {
        return item.rawJson.features?.some((f: any) =>
          String(f.properties?.ten_xa || "").toLowerCase().includes(queryStr)
        );
      }
      return false;
    });
  }, [searchQuery, items]);

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

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden">
      <div
        className={cn(
          "absolute top-3 left-3 z-10 w-80 max-h-[calc(100vh-90px)] bg-black/60 text-white backdrop-blur-md rounded-lg shadow-xl border border-white/15 flex flex-col transition-all duration-300",
          !sidebarOpen && "-translate-x-85"
        )}
      >
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 text-sm">Địa giới hành chính</span>
            <Badge
              count={`${items.filter((i: IAreaItem) => i.rawJson).length}/${AREA_FILES.length}`}
              style={{ backgroundColor: items.length === AREA_FILES.length ? "#52c41a" : "#1890ff" }}
            />
          </div>
          <Button
            type="text"
            size="small"
            onClick={() => refetch()}
            title="Tải lại dữ liệu"
            className="text-slate-300! hover:text-white! hover:bg-white/10!"
          >
            Tải lại
          </Button>
        </div>

        <div className="p-3 border-b border-white/10 flex flex-col gap-2">
          <Input
            placeholder="Tìm kiếm địa bàn / xã phường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
            className="bg-black/30! border-white/15! text-white! placeholder-slate-400! hover:border-white/30! focus:border-white/30! focus:ring-0!"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAllVisibility(true)}
                className="text-red-400 hover:text-red-300 hover:underline font-medium cursor-pointer"
              >
                Hiện tất cả
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => toggleAllVisibility(false)}
                className="text-slate-400 hover:text-slate-300 hover:underline cursor-pointer"
              >
                Ẩn tất cả
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[50vh]">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center p-4">
              <Spin size="small" />
            </div>
          ) : (
            filteredNames.map((name: string) => {
              const item = items.find((i: IAreaItem) => i.id === name);
              const color = DISTRICT_COLORS[name] || "#3b82f6";
              const isHidden = hiddenItems[name];
              const wardCount = item?.featureCount || item?.rawJson?.features?.length || 0;

              return (
                <div
                  key={name}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md transition-colors text-xs hover:bg-white/5 group",
                    isHidden && "opacity-50"
                  )}
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    onClick={() => flyToArea(name)}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-slate-200 truncate">{name}</span>
                    {!item ? (
                      <Spin size="small" className="ml-1 text-white!" />
                    ) : (
                      <span className="text-[10px] text-slate-400">({wardCount})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => toggleVisibility(name)}
                      className={cn("text-xs! hover:bg-white/10!", !isHidden ? "text-red-400! hover:text-red-300!" : "text-slate-400! hover:text-slate-300!")}
                    >
                      {!isHidden ? "Hiện" : "Ẩn"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Button
        type="default"
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="absolute top-3 left-3 z-20 shadow-2xl bg-black/60 text-white border-white/15 backdrop-blur-md hover:bg-black/85 hover:text-white! hover:border-white/30!"
        style={{ display: sidebarOpen ? "none" : "flex" }}
      >
        Danh sách địa bàn
      </Button>

      <div className="flex-1 w-full h-full">
        <Map
          ref={mapRef}
          viewport={{
            center: [106.6827833, 20.85861468],
            zoom: 12,
          }}
          styles={{
            light: SATELLITE_MAP_STYLE as any,
            dark: SATELLITE_MAP_STYLE as any,
          }}
        >
          <MapControls position="top-right" showFullscreen />
          <MapFullscreenTitle />
          <MapLegend
            districtColors={DISTRICT_COLORS}
            hiddenAreas={hiddenItems}
          />

          {items.map((item: IAreaItem) => {
            if (!item.rawJson || hiddenItems[item.id]) return null;

            const color = DISTRICT_COLORS[item.id] || "#3b82f6";

            return (
              <MapGeoJSON
                key={item.id}
                id={`area-${item.id}`}
                data={item.rawJson}
                promoteId="ma_xa"
                labelProperty="ten_xa"
                interactive
                fillPaint={{
                  "fill-color": ["coalesce", ["get", "mau_sac"], color],
                  "fill-opacity": 0.45,
                }}
                fillHoverPaint={{
                  "fill-opacity": 0.75,
                }}
                linePaint={{
                  "line-color": "#ffffff",
                  "line-width": 1.8,
                  "line-opacity": 0.9,
                }}
                onHover={(e: any) => {
                  if (e) {
                    setHoverInfo({
                      feature: e.feature as any,
                      longitude: e.longitude,
                      latitude: e.latitude,
                    });
                  } else {
                    setHoverInfo(null);
                  }
                }}
                onClick={(e: any) => {
                  setSelectedFeature({
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                  });
                }}
              />
            );
          })}
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
              onClose={() => {
                setSelectedFeature(null);
                setHoverInfo(null);
              }}
              closeButton
              closeOnClick={false}
              className="z-30 min-w-55"
              offset={32}
            >
              <div className="p-2 text-xs flex flex-col gap-1.5 text-white">
                <div className="font-bold text-sm text-red-400 border-b border-white/15 pb-1 flex items-center gap-1.5">
                  <span>{activeProperties?.ten_xa || activeProperties?.name || "Thông tin địa bàn"}</span>
                </div>
                {activeProperties?.dtich_km2 !== undefined && (
                  <div>
                    <span className="text-slate-300">Diện tích: </span>
                    <span className="font-semibold">{activeProperties.dtich_km2} km²</span>
                  </div>
                )}
                {activeProperties?.dan_so !== undefined && (
                  <div>
                    <span className="text-slate-300">Dân số: </span>
                    <span className="font-semibold">{Number(activeProperties.dan_so).toLocaleString("vi-VN")}</span>
                  </div>
                )}
                {activeProperties?.tru_so && (
                  <div>
                    <span className="text-slate-300">Trụ sở: </span>
                    {renderTruSoLink(activeProperties.tru_so)}
                  </div>
                )}
              </div>
            </MapPopup>
          )}
        </Map>
      </div>
    </div>
  );
};
