import { Badge, Input, Spin, Typography } from "antd";
import React from "react";

import {
  Map,
  MapControls,
  MapFullscreenTitle,
  MapMarker,
  MapPopup,
  MapRef,
  MarkerContent,
  useMap,
} from "@/components/map";
import { fetchCamerasGeoJson, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import {
  EnvironmentOutlined,
  SearchOutlined
} from "@ant-design/icons";

const TYPE_COLORS: Record<string, string> = {
  "tốc độ": "#ef4444",
  "AI": "#3b82f6",
  "giám sát": "#10b981",
};

const DEFAULT_COLOR = "#f59e0b";

function CameraMapLayers({
  geojson,
  onCameraClick,
}: {
  geojson: any;
  onCameraClick: (camera: any) => void;
}) {
  const { map, isLoaded } = useMap();

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!map) return;
    if (!geojson) return;

    const sourceId = "cameras-source";
    const layerId = "cameras-layer";

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
        generateId: true,
      });
    } else {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 15, 4],
          "circle-color": [
            "match",
            ["get", "type"],
            "tốc độ",
            TYPE_COLORS["tốc độ"],
            "AI",
            TYPE_COLORS["AI"],
            "giám sát",
            TYPE_COLORS["giám sát"],
            DEFAULT_COLOR,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    const clickHandler = (e: any) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        onCameraClick({
          properties: feature.properties,
          coordinates: feature.geometry.coordinates,
        });
      }
    };

    const mouseEnterHandler = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const mouseLeaveHandler = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", layerId, clickHandler);
    map.on("mouseenter", layerId, mouseEnterHandler);
    map.on("mouseleave", layerId, mouseLeaveHandler);

    return () => {
      try {
        if (map && map.getStyle() && map.getLayer(layerId)) {
          map.off("click", layerId, clickHandler);
          map.off("mouseenter", layerId, mouseEnterHandler);
          map.off("mouseleave", layerId, mouseLeaveHandler);
        }
      } catch (error) {
        // Ignore errors if map or style is already removed
      }
    };
  }, [map, isLoaded, geojson, onCameraClick]);

  return null;
}

export function CameraMapPage() {
  const mapRef = React.useRef<MapRef>(null);
  const [data, setData] = React.useState<any>(null);
  const [searchVal, setSearchVal] = React.useState("");
  const [selectedCamera, setSelectedCamera] = React.useState<any>(null);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    fetchCamerasGeoJson()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load cameras GeoJSON", err);
      });
  }, []);

  const handleCameraSelect = React.useCallback((camera: any) => {
    setSelectedCamera(camera);
    if (camera && mapRef.current) {
      mapRef.current.flyTo({
        center: camera.coordinates,
        zoom: 14,
        duration: 1000,
      });
    }
  }, []);

  const handleRefetch = React.useCallback(() => {
    setIsFetching(true);
    fetchCamerasGeoJson()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load cameras GeoJSON", err);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  const filteredGeojson = React.useMemo(() => {
    if (!data) return null;
    if (!searchVal.trim()) return data;

    const lowerSearch = searchVal.toLowerCase();
    const filteredFeatures = data.features.filter((f: any) => {
      const name = f.properties.name || "";
      const note = f.properties.note || "";
      const description = f.properties.description || "";
      return (
        name.toLowerCase().includes(lowerSearch) ||
        note.toLowerCase().includes(lowerSearch) ||
        description.toLowerCase().includes(lowerSearch)
      );
    });

    return {
      ...data,
      features: filteredFeatures,
    };
  }, [data, searchVal]);

  const searchResults = React.useMemo(() => {
    if (!data || !searchVal.trim()) return [];

    const lowerSearch = searchVal.toLowerCase();
    return data.features
      .filter((f: any) => {
        const name = f.properties.name || "";
        const note = f.properties.note || "";
        const description = f.properties.description || "";
        return (
          name.toLowerCase().includes(lowerSearch) ||
          note.toLowerCase().includes(lowerSearch) ||
          description.toLowerCase().includes(lowerSearch)
        );
      })
      .slice(0, 5)
      .map((f: any) => ({
        properties: f.properties,
        coordinates: f.geometry.coordinates,
      }));
  }, [data, searchVal]);

  const stats = React.useMemo(() => {
    if (!data) return [];

    const counts: Record<string, number> = {};
    for (const feature of data.features) {
      const type = feature.properties.type || "Khác";
      counts[type] = (counts[type] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden">
      <div className="flex-1 w-full h-full relative">
        {(!data || isFetching) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
            <Spin
              size="large"
              tip={<span className="text-white font-medium mt-2 block">Đang tải dữ liệu camera...</span>}
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
          <MapFullscreenTitle subtitle="BẢN ĐỒ CAMERA" />

          <CameraMapLayers
            geojson={filteredGeojson}
            onCameraClick={handleCameraSelect}
          />

          {selectedCamera && (
            <MapMarker
              key={`selected-camera-${selectedCamera.properties.id}`}
              longitude={selectedCamera.coordinates[0]}
              latitude={selectedCamera.coordinates[1]}
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
                      `https://www.google.com/maps?q=${selectedCamera.coordinates[1]},${selectedCamera.coordinates[0]}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  title="Mở Google Maps"
                >
                  <span className="relative flex h-5 w-5 justify-center items-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 border-2 border-white shadow-md items-center justify-center">
                      <EnvironmentOutlined className="text-white text-[10px]" />
                    </span>
                  </span>
                  <span className="mt-1 text-[10px] font-bold text-slate-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] whitespace-nowrap bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 transition-colors group-hover:bg-black/80">
                    {selectedCamera.properties.name}
                  </span>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {selectedCamera && (
            <MapPopup
              longitude={selectedCamera.coordinates[0]}
              latitude={selectedCamera.coordinates[1]}
              onClose={() => setSelectedCamera(null)}
              closeButton
              closeOnClick={false}
              className="z-30 w-120 h-fit max-w-[90vw]"
              offset={16}
            >
              <div className="text-zinc-100 w-full flex flex-col gap-2">
                <div className="font-bold border-b border-white/10 pb-1.5 pr-4 flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                    style={{
                      backgroundColor: TYPE_COLORS[selectedCamera.properties.type] || DEFAULT_COLOR,
                      boxShadow: `0 0 6px ${(TYPE_COLORS[selectedCamera.properties.type] || DEFAULT_COLOR)}80`,
                    }}
                  />
                  <span className="text-xs sm:text-sm font-semibold truncate" title={selectedCamera.properties.name}>
                    {selectedCamera.properties.name}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs max-h-100 overflow-y-auto pr-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400">Loại</span>
                    <Badge
                      status="default"
                      text={<span className="text-xs text-white! font-semibold">{selectedCamera.properties.type}</span>}
                      color={TYPE_COLORS[selectedCamera.properties.type] || DEFAULT_COLOR}
                    />
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Hướng</span>
                    <span className="font-medium text-zinc-100 text-right">{selectedCamera.properties.direction || "-"}</span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">HT. 33 camera cũ</span>
                    <span className="font-medium text-zinc-100 text-right">{selectedCamera.properties.oldSystem || "-"}</span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Mạng</span>
                    <span className="font-medium text-zinc-100 text-right">{selectedCamera.properties.network || "-"}</span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Điện/Tủ</span>
                    <span className="font-medium text-zinc-100 text-right">{selectedCamera.properties.power || "-"}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400">Ghi chú</span>
                    <span className="font-medium text-zinc-200 bg-white/5 p-2 rounded border border-white/5 text-xs leading-normal">
                      {selectedCamera.properties.note || "-"}
                    </span>
                  </div>

                  {selectedCamera.properties.description && (
                    <div className="flex flex-col gap-1">
                      <span className="text-zinc-400">Mô tả chi tiết</span>
                      <span className="font-medium text-zinc-300 bg-white/5 p-2 rounded border border-white/5 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {selectedCamera.properties.description}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-white/10 mt-1">
                    <span className="text-zinc-400">Bản đồ</span>
                    <Typography.Link
                      href={`https://www.google.com/maps?q=${selectedCamera.coordinates[1]},${selectedCamera.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400! hover:text-blue-300! font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        className="w-3.5 h-3.5 shrink-0 fill-[#EA4335]"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
                      </svg>
                      <span className="text-xs">Google Maps</span>
                    </Typography.Link>
                  </div>
                </div>
              </div>
            </MapPopup>
          )}

          <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-3">
            <div className="bg-black/50 backdrop-blur-md border border-white/15 shadow-2xl rounded-xl p-2.5 relative">
              <Input
                allowClear
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                }}
                className="bg-black/40! border-white/10! hover:border-white/20! focus:border-blue-500! text-white! placeholder-slate-400! text-xs py-1.5 px-3 rounded-lg"
                prefix={<SearchOutlined className="text-slate-400 mr-1 text-[13px]" />}
              />

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-black/75 backdrop-blur-lg border border-white/15 shadow-2xl rounded-xl overflow-hidden z-20 flex flex-col max-h-60 overflow-y-auto">
                  {searchResults.map((camera: any) => (
                    <div
                      key={`search-res-${camera.properties.id}`}
                      onClick={() => {
                        handleCameraSelect(camera);
                        setSearchVal("");
                      }}
                      className="px-3.5 py-2 hover:bg-white/10 cursor-pointer flex flex-col gap-0.5 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="text-slate-100 font-medium text-xs truncate">
                        {camera.properties.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[camera.properties.type] || DEFAULT_COLOR }}
                        />
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">
                          {camera.properties.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend Panel at bottom-right */}
          <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white backdrop-blur-md border border-white/15 shadow-2xl rounded-xl p-4 text-xs font-sans leading-relaxed w-72">
            <div className="font-bold text-xs uppercase tracking-wider text-white border-b border-white/20 pb-1.5 mb-2.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              CHÚ GIẢI
            </div>
            <div className="flex flex-col gap-2">
              {stats.map(([type, count]) => {
                const color = TYPE_COLORS[type] || DEFAULT_COLOR;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[11px] font-medium text-slate-100 truncate">{type}</span>
                    </div>
                    <Badge
                      count={count}
                      overflowCount={99999}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        color: "#f1f5f9",
                        boxShadow: "none",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "10px",
                        height: "18px",
                        lineHeight: "16px",
                        minWidth: "24px",
                      }}
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm bg-white/25" />
                  <span className="text-[11px] font-bold text-slate-100 truncate">Tổng số</span>
                </div>
                <Badge
                  count={data?.features?.length || 0}
                  overflowCount={99999}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    color: "#ffffff",
                    boxShadow: "none",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "10px",
                    fontWeight: "bold",
                    height: "18px",
                    lineHeight: "16px",
                    minWidth: "24px",
                  }}
                />
              </div>
            </div>
          </div>
        </Map>
      </div>
    </div>
  );
}
