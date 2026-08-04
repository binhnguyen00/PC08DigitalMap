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

const STRAVA_ORANGE = "#FC4C02";

const ROUTE_COLORS: Record<string, string> = {
  QL5: STRAVA_ORANGE,
  QL10: STRAVA_ORANGE,
  QL17B: STRAVA_ORANGE,
  ĐT351: STRAVA_ORANGE,
  ĐT354: STRAVA_ORANGE,
  ĐT355: STRAVA_ORANGE,
  ĐT360: STRAVA_ORANGE,
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

  const activePopupInfo = selectedFeature;
  const activeProperties = activePopupInfo?.feature?.properties;

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
            <span className="font-semibold text-slate-100 text-sm">Tuyến đường giao thông</span>
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
            className="text-slate-300! hover:text-white! hover:bg-white/10!"
          >
            Tải lại
          </Button>
        </div>

        <div className="p-3 border-b border-white/10 flex flex-col gap-2">
          <Input
            placeholder="Tìm kiếm tuyến đường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
            className="bg-black/30! border-white/15! text-white! placeholder-slate-400! hover:border-white/30! focus:border-white/30! focus:ring-0!"
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
                    "flex items-center justify-between p-2 rounded-md transition-colors text-xs hover:bg-white/5 group",
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
                    <span className="font-medium text-slate-200 truncate">{name}</span>
                    {!item ? (
                      <Spin size="small" className="ml-1 text-white!" />
                    ) : (
                      <span className="text-[10px] text-slate-400">({segmentCount} đoạn)</span>
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

          {items.map((item: IRouteItem) => {
            if (!item.rawJson || hiddenItems[item.id]) return null;

            const color = ROUTE_COLORS[item.id] || STRAVA_ORANGE;

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
                  "line-color": "#18181b",
                  "line-width": 6.5,
                  "line-opacity": 0.75,
                  "line-blur": 1,
                }}
                linePaint={{
                  "line-color": color,
                  "line-width": 3.5,
                  "line-opacity": 1,
                }}
                labelProperty="ten_tuyen"
                symbolLayout={{
                  "symbol-placement": "line",
                  "text-size": 10,
                  "text-allow-overlap": true,
                  "text-ignore-placement": true,
                  "text-keep-upright": true,
                  "text-max-angle": 45,
                  "symbol-spacing": 150,
                }}
                symbolPaint={{
                  "text-color": "#ffffff",
                  "text-halo-color": "#000000",
                  "text-halo-width": 2,
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
              <div className="p-2 text-xs flex flex-col gap-1.5 text-white">
                <div className="font-bold text-sm text-red-400 border-b border-white/15 pb-1">
                  <span>{activeProperties?.ten_tuyen || activeProperties?.name || "Tuyến đường"}</span>
                </div>
                {activeProperties?.chieu_dai && (
                  <div>
                    <span className="text-slate-300">Chiều dài: </span>
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
