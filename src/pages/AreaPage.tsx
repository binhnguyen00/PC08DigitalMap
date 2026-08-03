import React from "react";
import { useMany } from "@refinedev/core";
import {
  EnvironmentOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Input, Spin, Badge, Button, Tooltip, Tag } from "antd";
import type * as GeoJSON from "geojson";

import { Map, MapGeoJSON, MapControls, MapPopup, MapRef } from "@/components/map";
import { AREA_FILES } from "@/libs/cdn";
import { IAreaItem } from "@/interfaces";
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
            <EnvironmentOutlined className="text-red-600 font-bold" />
            <span className="font-semibold text-gray-800 text-sm">Administrative Areas</span>
            <Badge
              count={`${items.filter((i: IAreaItem) => i.rawJson).length}/${AREA_FILES.length}`}
              style={{ backgroundColor: items.length === AREA_FILES.length ? "#52c41a" : "#1890ff" }}
            />
          </div>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            title="Reload useMany"
          />
        </div>

        <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
          <Input
            placeholder="Search areas / wards..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
          />
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Show all:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAllVisibility(true)}
                className="text-red-600 hover:underline font-medium cursor-pointer"
              >
                Enable all
              </button>
              <span>|</span>
              <button
                type="button"
                onClick={() => toggleAllVisibility(false)}
                className="text-gray-600 hover:underline cursor-pointer"
              >
                Disable all
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

                  <div className="flex items-center gap-1">
                    <Tooltip title="Locate">
                      <Button
                        type="text"
                        size="small"
                        icon={<CompassOutlined />}
                        onClick={() => flyToArea(name)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600"
                      />
                    </Tooltip>
                    <Button
                      type="text"
                      size="small"
                      icon={!isHidden ? <EyeOutlined className="text-red-600" /> : <EyeInvisibleOutlined className="text-gray-400" />}
                      onClick={() => toggleVisibility(name)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activeProperties && (
          <div className="p-3 border-t border-gray-200 bg-red-50/50 text-xs flex flex-col gap-1.5 rounded-b-lg">
            <div className="flex items-center justify-between font-bold text-red-900 border-b border-red-200/60 pb-1">
              <span>{activeProperties.ten_xa || activeProperties.name || "Area details"}</span>
              {activeProperties.loai && <Tag color="red">{activeProperties.loai}</Tag>}
            </div>

            {activeProperties.ten_tinh && (
              <div className="flex justify-between">
                <span className="text-gray-500">Province/City:</span>
                <span className="font-medium">{activeProperties.ten_tinh}</span>
              </div>
            )}
            {activeProperties.dtich_km2 !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Area:</span>
                <span className="font-medium">{activeProperties.dtich_km2} km²</span>
              </div>
            )}
            {activeProperties.dan_so !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Population:</span>
                <span className="font-medium">{Number(activeProperties.dan_so).toLocaleString("vi-VN")}</span>
              </div>
            )}
            {activeProperties.matdo_km2 !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">Density:</span>
                <span className="font-medium">{Number(activeProperties.matdo_km2).toLocaleString("vi-VN")} /km²</span>
              </div>
            )}
            {activeProperties.tru_so && (
              <div className="flex justify-between">
                <span className="text-gray-500">Headquarters:</span>
                <span className="font-medium truncate max-w-42.5" title={activeProperties.tru_so}>
                  {activeProperties.tru_so}
                </span>
              </div>
            )}
            {activeProperties.sap_nhap && (
              <div className="mt-1 pt-1 border-t border-red-200/50">
                <span className="text-gray-500 block mb-0.5">Merger plan:</span>
                <span className="text-gray-700 italic text-[11px] block">{activeProperties.sap_nhap}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        type="default"
        icon={<EnvironmentOutlined />}
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="absolute top-3 left-3 z-20 shadow-md bg-white border-gray-300"
        style={{ display: sidebarOpen ? "none" : "flex" }}
      >
        Area List
      </Button>

      <div className="flex-1 w-full h-full">
        <Map
          ref={mapRef}
          viewport={{
            center: [106.68, 20.85],
            zoom: 11,
          }}
          theme="light"
          className="w-full h-full"
        >
          <MapControls position="top-right" />

          {items.map((item: IAreaItem) => {
            if (!item.rawJson || hiddenItems[item.id]) return null;

            const color = DISTRICT_COLORS[item.id] || "#3b82f6";

            return (
              <MapGeoJSON
                key={item.id}
                id={`area-${item.id}`}
                data={item.rawJson}
                promoteId="ma_xa"
                interactive
                fillPaint={{
                  "fill-color": ["coalesce", ["get", "mau_sac"], color],
                  "fill-opacity": 0.45,
                }}
                fillHoverPaint={{
                  "fill-opacity": 0.75,
                }}
                linePaint={{
                  "line-color": color,
                  "line-width": 1.8,
                  "line-opacity": 0.9,
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
              className="z-30 min-w-55"
            >
              <div className="p-2 text-xs flex flex-col gap-1">
                <div className="font-bold text-sm text-red-600 border-b pb-1 flex items-center gap-1.5">
                  <InfoCircleOutlined />
                  <span>{activeProperties?.ten_xa || activeProperties?.name || "Area Info"}</span>
                </div>
                {activeProperties?.loai && (
                  <div>
                    <span className="text-gray-500">Type: </span>
                    <span className="font-semibold">{activeProperties.loai}</span>
                  </div>
                )}
                {activeProperties?.ten_tinh && (
                  <div>
                    <span className="text-gray-500">Province: </span>
                    <span className="font-semibold">{activeProperties.ten_tinh}</span>
                  </div>
                )}
                {activeProperties?.dtich_km2 !== undefined && (
                  <div>
                    <span className="text-gray-500">Area: </span>
                    <span className="font-semibold">{activeProperties.dtich_km2} km²</span>
                  </div>
                )}
                {activeProperties?.dan_so !== undefined && (
                  <div>
                    <span className="text-gray-500">Population: </span>
                    <span className="font-semibold">{Number(activeProperties.dan_so).toLocaleString("vi-VN")}</span>
                  </div>
                )}
                {activeProperties?.tru_so && (
                  <div>
                    <span className="text-gray-500">Headquarters: </span>
                    <span className="font-semibold">{activeProperties.tru_so}</span>
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
