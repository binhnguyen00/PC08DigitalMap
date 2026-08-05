import { useMany } from "@refinedev/core";
import { Badge, FloatButton, Space, Spin, Typography } from "antd";
import type * as GeoJSON from "geojson";
import React from "react";

import { CompassOutlined, ExportOutlined, LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Map, MapControls, MapFullscreenTitle, MapGeoJSON, MapLegend, MapMarker, MapPopup, MapRef, MarkerContent } from "@/components/map";
import { IAreaItem, IRouteItem } from "@/interfaces";
import { AREA_FILES, fetchHaiphongGeoJson, ROUTE_FILES, SATELLITE_MAP_STYLE } from "@/libs/cdn";

interface IHoverInfo {
  type: "area" | "route";
  feature: GeoJSON.Feature;
  longitude: number;
  latitude: number;
  color?: string;
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
  const [haiphongBoundary, setHaiphongBoundary] = React.useState<any>(null);

  React.useEffect(() => {
    fetchHaiphongGeoJson()
      .then((res) => {
        setHaiphongBoundary(res);
      })
      .catch((err) => {
        console.error("Failed to load Hải Phòng boundary GeoJSON", err);
      });
  }, []);

  const areaItems = React.useMemo<IAreaItem[]>(() => areaQuery?.data?.data || [], [areaQuery?.data]);
  const routeItems = React.useMemo<IRouteItem[]>(() => routeQuery?.data?.data || [], [routeQuery?.data]);

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
              tip={<span className="text-white font-medium mt-2 block">Đang tải dữ liệu bản đồ...</span>}
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
          <MapControls position="top-right" showFullscreen />
          <MapFullscreenTitle />
          <MapLegend districtColors={DISTRICT_COLORS} alwaysShow/>

          {haiphongBoundary && (
            <MapGeoJSON
              id="haiphong-boundary"
              data={haiphongBoundary}
              fillPaint={false}
              linePaint={{
                "line-color": "#3b82f6",
                "line-width": 3,
                "line-opacity": 1,
              }}
            />
          )}

          {/* Area polygon layers */}
          {areaItems.map((item: IAreaItem) => {
            if (!item.rawJson) return null;

            const color = DISTRICT_COLORS[item.id] || "#3b82f6";

            return (
              <MapGeoJSON
                key={`area-${item.id}`}
                id={`area-${item.id}`}
                data={item.rawJson}
                promoteId="ma_xa"
                interactive
                fillPaint={{
                  "fill-color": ["coalesce", ["get", "mau_sac"], color],
                  "fill-opacity": 0.25,
                }}
                fillHoverPaint={{
                  "fill-opacity": 0.7,
                }}
                linePaint={{
                  "line-color": "#ffffff",
                  "line-width": 1.8,
                  "line-opacity": 0.9,
                }}
                onClick={(e: any) => {
                  setSelectedFeature({
                    type: "area",
                    feature: e.feature as any,
                    longitude: e.longitude,
                    latitude: e.latitude,
                    color: e.feature?.properties?.mau_sac || color,
                  });
                }}
              />
            );
          })}

          {/* Route line layers */}
          {routeItems.map((item: IRouteItem) => {
            if (!item.rawJson) return null;

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
                key={`route-${item.id}`}
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
                  "text-halo-width": 1,
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

          {/* Area label symbol layers */}
          {areaItems.map((item: IAreaItem) => {
            if (!item.rawJson) return null;

            return (
              <MapGeoJSON
                key={`area-label-${item.id}`}
                id={`area-label-${item.id}`}
                data={item.rawJson}
                fillPaint={false}
                linePaint={false}
                labelProperty="ten_xa"
                symbolLayout={{
                  "text-size": 11,
                  "text-allow-overlap": true,
                  "text-ignore-placement": true,
                }}
                symbolPaint={{
                  "text-color": "#ffffff",
                  "text-halo-color": "#000000",
                  "text-halo-width": 2,
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
