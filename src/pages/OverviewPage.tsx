import { useMany } from "@refinedev/core";
import { Badge, Button, Input, Spin, Tabs } from "antd";
import type * as GeoJSON from "geojson";
import React from "react";

import { Map, MapControls, MapGeoJSON, MapPopup, MapRef, MapFullscreenTitle, MapLegend } from "@/components/map";
import { IAreaItem, IRouteItem } from "@/interfaces";
import { AREA_FILES, ROUTE_FILES, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import { cn } from "@/libs/tailwind";

interface IHoverInfo {
  type: "area" | "route";
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

const ROUTE_COLORS: Record<string, string> = {
  QL17B: "#2563eb",
  QL5: "#00d2ff",
  ĐT355: "#38bdf8",
};

export const OverviewPage: React.FC = () => {
  const mapRef = React.useRef<MapRef>(null);

  const { query: areaQuery } = useMany<IAreaItem>({
    resource: "areas",
    ids: AREA_FILES,
  });

  const { query: routeQuery } = useMany<IRouteItem>({
    resource: "routes",
    ids: ROUTE_FILES,
  });

  const isAreasLoading = areaQuery.isLoading;
  const isRoutesLoading = routeQuery.isLoading;

  const [hiddenAreas, setHiddenAreas] = React.useState<Record<string, boolean>>({});
  const [hiddenRoutes, setHiddenRoutes] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFeature, setSelectedFeature] = React.useState<IHoverInfo | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<IHoverInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"all" | "areas" | "routes">("all");

  const areaItems = React.useMemo<IAreaItem[]>(() => areaQuery?.data?.data || [], [areaQuery?.data]);
  const routeItems = React.useMemo<IRouteItem[]>(() => routeQuery?.data?.data || [], [routeQuery?.data]);

  const toggleAreaVisibility = React.useCallback((id: string) => {
    setHiddenAreas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const toggleRouteVisibility = React.useCallback((id: string) => {
    setHiddenRoutes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const toggleAllVisibility = React.useCallback((show: boolean) => {
    setHiddenAreas(() => {
      const next: Record<string, boolean> = {};
      if (!show) {
        for (const name of AREA_FILES) next[name] = true;
      }
      return next;
    });
    setHiddenRoutes(() => {
      const next: Record<string, boolean> = {};
      if (!show) {
        for (const name of ROUTE_FILES) next[name] = true;
      }
      return next;
    });
  }, []);

  const flyToArea = React.useCallback((name: string) => {
    const item = areaItems.find((i: IAreaItem) => i.id === name);
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
  }, [areaItems]);

  const flyToRoute = React.useCallback((name: string) => {
    const item = routeItems.find((i: IRouteItem) => i.id === name);
    if (!item?.rawJson || !mapRef.current) return;

    try {
      const coords: [number, number][] = [];
      const extractCoords = (geometry: any) => {
        if (!geometry?.coordinates) return;
        if (geometry.type === "LineString") {
          geometry.coordinates.forEach((pt: [number, number]) => coords.push(pt));
        } else if (geometry.type === "MultiLineString") {
          geometry.coordinates.forEach((line: any) => {
            line.forEach((pt: [number, number]) => coords.push(pt));
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
      console.warn("Could not calculate bounds for flyToRoute", e);
    }
  }, [routeItems]);

  const filteredAreaNames = React.useMemo(() => {
    if (!searchQuery.trim()) return AREA_FILES;
    const q = searchQuery.toLowerCase();
    return AREA_FILES.filter((name: string) => {
      if (name.toLowerCase().includes(q)) return true;
      const item = areaItems.find((i: IAreaItem) => i.id === name);
      return item?.rawJson?.features?.some((f: any) =>
        String(f.properties?.ten_xa || "").toLowerCase().includes(q)
      );
    });
  }, [searchQuery, areaItems]);

  const filteredRouteNames = React.useMemo(() => {
    if (!searchQuery.trim()) return ROUTE_FILES;
    const q = searchQuery.toLowerCase();
    return ROUTE_FILES.filter((name: string) => name.toLowerCase().includes(q));
  }, [searchQuery]);

  const activePopupInfo = selectedFeature || hoverInfo;
  const activeProperties = activePopupInfo?.feature?.properties;

  const handleRefetch = () => {
    areaQuery.refetch();
    routeQuery.refetch();
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden">
      <div
        className={cn(
          "absolute top-3 left-3 z-10 w-80 max-h-[calc(100vh-90px)] bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 flex flex-col transition-all duration-300",
          !sidebarOpen && "-translate-x-85"
        )}
      >
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Badge
              count={`${areaItems.filter((i) => i.rawJson).length + routeItems.filter((i) => i.rawJson).length}/${AREA_FILES.length + ROUTE_FILES.length}`}
              style={{ backgroundColor: "#52c41a" }}
            />
          </div>
          <Button
            type="text"
            size="small"
            onClick={handleRefetch}
            title="Tải lại dữ liệu"
          >
            Tải lại
          </Button>
        </div>

        <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
          <Input
            placeholder="Tìm kiếm địa bàn, xã phường, tuyến đường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
          />
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAllVisibility(true)}
                className="text-red-600 hover:underline font-medium cursor-pointer"
              >
                Hiện tất cả
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => toggleAllVisibility(false)}
                className="text-gray-600 hover:underline cursor-pointer"
              >
                Ẩn tất cả
              </button>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as any)}
            size="small"
            className="mt-1"
            items={[
              { key: "all", label: "Tất cả" },
              { key: "areas", label: `Địa bàn (${filteredAreaNames.length})` },
              { key: "routes", label: `Tuyến đường (${filteredRouteNames.length})` },
            ]}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[45vh]">
          {(activeTab === "all" || activeTab === "areas") && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Địa bàn ({filteredAreaNames.length})</span>
              </div>
              {isAreasLoading && areaItems.length === 0 ? (
                <div className="flex justify-center p-2">
                  <Spin size="small" />
                </div>
              ) : (
                filteredAreaNames.map((name: string) => {
                  const item = areaItems.find((i: IAreaItem) => i.id === name);
                  const color = DISTRICT_COLORS[name] || "#3b82f6";
                  const isHidden = hiddenAreas[name];
                  const wardCount = item?.featureCount || item?.rawJson?.features?.length || 0;

                  return (
                    <div
                      key={`area-${name}`}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md transition-colors text-xs hover:bg-gray-100 group",
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
                        <span className="font-medium text-gray-800 truncate">{name}</span>
                        {!item ? (
                          <Spin size="small" className="ml-1" />
                        ) : (
                          <span className="text-[10px] text-gray-400">({wardCount})</span>
                        )}
                      </div>

                      <Button
                        type="text"
                        size="small"
                        onClick={() => toggleAreaVisibility(name)}
                        className={cn("text-xs", !isHidden ? "text-red-600" : "text-gray-400")}
                      >
                        {!isHidden ? "Hiện" : "Ẩn"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {(activeTab === "all" || activeTab === "routes") && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Tuyến đường ({filteredRouteNames.length})</span>
              </div>
              {isRoutesLoading && routeItems.length === 0 ? (
                <div className="flex justify-center p-2">
                  <Spin size="small" />
                </div>
              ) : (
                filteredRouteNames.map((name: string) => {
                  const item = routeItems.find((i: IRouteItem) => i.id === name);
                  const color = ROUTE_COLORS[name] || "#2563eb";
                  const isHidden = hiddenRoutes[name];
                  const segmentCount = item?.featureCount || item?.rawJson?.features?.length || 0;

                  return (
                    <div
                      key={`route-${name}`}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md transition-colors text-xs hover:bg-gray-100 group",
                        isHidden && "opacity-50"
                      )}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        onClick={() => flyToRoute(name)}
                      >
                        <span
                          className="w-3.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-gray-800 truncate">{name}</span>
                        {!item ? (
                          <Spin size="small" className="ml-1" />
                        ) : (
                          <span className="text-[10px] text-gray-400">({segmentCount} đoạn)</span>
                        )}
                      </div>

                      <Button
                        type="text"
                        size="small"
                        onClick={() => toggleRouteVisibility(name)}
                        className={cn("text-xs", !isHidden ? "text-red-600" : "text-gray-400")}
                      >
                        {!isHidden ? "Hiện" : "Ẩn"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <Button
        type="default"
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="absolute top-3 left-3 z-20 shadow-md bg-white border-gray-300"
        style={{ display: sidebarOpen ? "none" : "flex" }}
      >
        Danh sách dữ liệu
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
            routeColors={ROUTE_COLORS}
            hiddenAreas={hiddenAreas}
            hiddenRoutes={hiddenRoutes}
          />

          {/* Area polygon layers */}
          {areaItems.map((item: IAreaItem) => {
            if (!item.rawJson || hiddenAreas[item.id]) return null;

            const color = DISTRICT_COLORS[item.id] || "#3b82f6";

            return (
              <MapGeoJSON
                key={`area-${item.id}`}
                id={`area-${item.id}`}
                data={item.rawJson}
                promoteId="ma_xa"
                labelProperty="ten_xa"
                interactive
                fillPaint={{
                  "fill-color": ["coalesce", ["get", "mau_sac"], color],
                  "fill-opacity": 0.4,
                }}
                fillHoverPaint={{
                  "fill-opacity": 0.7,
                }}
                linePaint={{
                  "line-color": "#ffffff",
                  "line-width": 1.8,
                  "line-opacity": 0.9,
                }}
                onHover={(e: any) => {
                  if (e) {
                    setHoverInfo({
                      type: "area",
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
                    type: "area",
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                  });
                }}
              />
            );
          })}

          {/* Route line layers */}
          {routeItems.map((item: IRouteItem) => {
            if (!item.rawJson || hiddenRoutes[item.id]) return null;

            const color = ROUTE_COLORS[item.id] || "#00d2ff";

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
                  "line-color": "#032b53",
                  "line-width": 12,
                  "line-opacity": 0.85,
                  "line-blur": 1.5,
                }}
                linePaint={{
                  "line-color": color,
                  "line-width": 6,
                  "line-opacity": 1,
                }}
                labelProperty="ten_tuyen"
                symbolLayout={{
                  "symbol-placement": "line",
                  "text-size": 14,
                  "text-allow-overlap": true,
                  "text-ignore-placement": true,
                  "text-keep-upright": true,
                  "text-max-angle": 30,
                  "symbol-spacing": 250,
                }}
                symbolPaint={{
                  "text-color": "#ffffff",
                  "text-halo-color": "#032b53",
                  "text-halo-width": 3,
                }}
                onHover={(e: any) => {
                  if (e) {
                    setHoverInfo({
                      type: "route",
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
                    type: "route",
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                  });
                }}
              />
            );
          })}

          {activePopupInfo && (
            <MapPopup
              longitude={activePopupInfo.longitude}
              latitude={activePopupInfo.latitude}
              onClose={() => {
                setSelectedFeature(null);
                setHoverInfo(null);
              }}
              closeButton
              closeOnClick={false}
              className="z-30 min-w-55"
            >
              <div className="p-2 text-xs flex flex-col gap-1">
                {activePopupInfo.type === "area" ? (
                  <>
                    <div className="font-bold text-sm text-red-600 border-b pb-1 flex items-center gap-1.5">
                      <span>{activeProperties?.ten_xa || activeProperties?.name || "Thông tin địa bàn"}</span>
                    </div>
                    {activeProperties?.dtich_km2 !== undefined && (
                      <div>
                        <span className="text-gray-500">Diện tích: </span>
                        <span className="font-semibold">{activeProperties.dtich_km2} km²</span>
                      </div>
                    )}
                    {activeProperties?.dan_so !== undefined && (
                      <div>
                        <span className="text-gray-500">Dân số: </span>
                        <span className="font-semibold">{Number(activeProperties.dan_so).toLocaleString("vi-VN")}</span>
                      </div>
                    )}
                    {activeProperties?.tru_so && (
                      <div>
                        <span className="text-gray-500">Trụ sở: </span>
                        <span className="font-semibold">{activeProperties.tru_so}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-bold text-sm text-blue-600 border-b pb-1 flex items-center gap-1.5">
                      <span>{activeProperties?.ten_tuyen || activeProperties?.name || "Tuyến đường"}</span>
                    </div>
                    {activeProperties?.chieu_dai && (
                      <div>
                        <span className="text-gray-500">Chiều dài: </span>
                        <span className="font-semibold">{activeProperties.chieu_dai} km</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </MapPopup>
          )}
        </Map>
      </div>
    </div>
  );
};
