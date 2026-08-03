import React from "react";
import { useMany } from "@refinedev/core";
import { Input, Spin, Badge, Button } from "antd";
import type * as GeoJSON from "geojson";

import { Map, MapGeoJSON, MapControls, MapPopup, MapRef, MapFullscreenTitle, MapLegend } from "@/components/map";
import { ROUTE_FILES, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import { IRouteItem } from "@/interfaces";
import { cn } from "@/libs/tailwind";

interface IHoverInfo {
  feature: GeoJSON.Feature;
  longitude: number;
  latitude: number;
}

const ROUTE_COLORS: Record<string, string> = {
  QL17B: "#2563eb",
  QL5: "#00d2ff",
  ĐT355: "#38bdf8",
};

export const RoutePage: React.FC = () => {
  const mapRef = React.useRef<MapRef>(null);

  const { query } = useMany<IRouteItem>({
    resource: "routes",
    ids: ROUTE_FILES,
  });

  const isLoading = query.isLoading;
  const refetch = query.refetch;

  const [hiddenItems, setHiddenItems] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFeature, setSelectedFeature] = React.useState<IHoverInfo | null>(null);
  const [hoverInfo, setHoverInfo] = React.useState<IHoverInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const items = React.useMemo<IRouteItem[]>(() => query?.data?.data || [], [query?.data]);

  const toggleVisibility = React.useCallback((id: string) => {
    setHiddenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const flyToRoute = React.useCallback((name: string) => {
    const item = items.find((i: IRouteItem) => i.id === name);
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
      console.warn("Could not calculate bounds for flyTo", e);
    }
  }, [items]);

  const filteredNames = React.useMemo(() => {
    if (!searchQuery.trim()) return ROUTE_FILES;
    const queryStr = searchQuery.toLowerCase();
    return ROUTE_FILES.filter((name: string) => name.toLowerCase().includes(queryStr));
  }, [searchQuery]);

  const activePopupInfo = selectedFeature || hoverInfo;
  const activeProperties = activePopupInfo?.feature?.properties;

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
            <span className="font-semibold text-gray-800 text-sm">Tuyến đường giao thông</span>
            <Badge
              count={`${items.filter((i: IRouteItem) => i.rawJson).length}/${ROUTE_FILES.length}`}
              style={{ backgroundColor: items.length === ROUTE_FILES.length ? "#52c41a" : "#1890ff" }}
            />
          </div>
          <Button
            type="text"
            size="small"
            onClick={() => refetch()}
            title="Tải lại dữ liệu"
          >
            Tải lại
          </Button>
        </div>

        <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
          <Input
            placeholder="Tìm kiếm tuyến đường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[50vh]">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center p-4">
              <Spin size="small" />
            </div>
          ) : (
            filteredNames.map((name: string) => {
              const item = items.find((i: IRouteItem) => i.id === name);
              const color = ROUTE_COLORS[name] || "#2563eb";
              const isHidden = hiddenItems[name];
              const segmentCount = item?.featureCount || item?.rawJson?.features?.length || 0;

              return (
                <div
                  key={name}
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

                  <div className="flex items-center gap-1">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => toggleVisibility(name)}
                      className={cn("text-xs", !isHidden ? "text-red-600" : "text-gray-400")}
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
        className="absolute top-3 left-3 z-20 shadow-md bg-white border-gray-300"
        style={{ display: sidebarOpen ? "none" : "flex" }}
      >
        Danh sách tuyến đường
      </Button>

      <div className="flex-1 w-full h-full">
        <Map
          ref={mapRef}
          viewport={{
            center: [106.68, 20.85],
            zoom: 11,
          }}
          styles={{
            light: SATELLITE_MAP_STYLE as any,
            dark: SATELLITE_MAP_STYLE as any,
          }}
          className="w-full h-full"
        >
          <MapControls position="top-right" showFullscreen />
          <MapFullscreenTitle />
          <MapLegend
            routeColors={ROUTE_COLORS}
            hiddenRoutes={hiddenItems}
          />

          {items.map((item: IRouteItem) => {
            if (!item.rawJson || hiddenItems[item.id]) return null;

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
                key={item.id}
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
                onHover={(e) => {
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
                onClick={(e) => {
                  setSelectedFeature({
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
              className="z-30 min-w-50"
            >
              <div className="p-2 text-xs flex flex-col gap-1">
                <div className="font-bold text-sm text-red-600 border-b pb-1">
                  <span>{activeProperties?.ten_tuyen || activeProperties?.name || "Tuyến đường"}</span>
                </div>
                {activeProperties?.chieu_dai && (
                  <div>
                    <span className="text-gray-500">Chiều dài: </span>
                    <span className="font-semibold">{activeProperties.chieu_dai} km</span>
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
