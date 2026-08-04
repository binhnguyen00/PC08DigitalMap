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
        className="text-blue-400 hover:text-blue-300 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3 shrink-0 fill-[#EA4335]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
        </svg>
        <span>Google Maps</span>
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
            alwaysShow
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
              className="z-30 w-48"
              offset={24}
            >
              <div className="text-zinc-100 w-full flex flex-col gap-1.5">
                <div className="font-bold border-b border-white/10 pb-1.5 pr-4 flex items-center gap-1.5">
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
              </div>
            </MapPopup>
          )}
        </Map>
      </div>
    </div>
  );
};
