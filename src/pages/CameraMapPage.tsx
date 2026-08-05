import React from "react";
import { Badge, Input, Modal, Typography, Descriptions } from "antd";
import { Map, MapControls, useMap } from "@/components/map";
import { fetchCamerasGeoJson, SATELLITE_MAP_STYLE } from "@/libs/cdn";

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  "tốc độ"    : "#ef4444",
  "AI"        : "#3b82f6",
  "giám sát"  : "#10b981",
};

const DEFAULT_COLOR = "#f59e0b";

function CameraMapLayers({ geojson, onCameraClick }: {
  geojson: any;
  onCameraClick: (camera: any) => void;
}) {
  const { map } = useMap();

  React.useEffect(() => {
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
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 8],
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
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    const clickHandler = (e: any) => {
      if (e.features && e.features.length > 0) {
        onCameraClick(e.features[0].properties);
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
      if (map.getLayer(layerId)) {
        map.off("click", layerId, clickHandler);
        map.off("mouseenter", layerId, mouseEnterHandler);
        map.off("mouseleave", layerId, mouseLeaveHandler);
      }
    };
  }, [map, geojson, onCameraClick]);

  return null;
}

export function CameraMapPage() {
  const [data, setData] = React.useState<any>(null);
  const [searchVal, setSearchVal] = React.useState("");
  const [selectedCamera, setSelectedCamera] = React.useState<any>(null);

  React.useEffect(() => {
    fetchCamerasGeoJson()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load cameras GeoJSON", err);
      });
  }, []);

  const filteredGeojson = React.useMemo(() => {
    if (!data) return null;
    if (!searchVal.trim()) return data;

    const lowerSearch = searchVal.toLowerCase();
    const filteredFeatures = data.features.filter((f: any) => {
      const name = f.properties.name || "";
      return name.toLowerCase().includes(lowerSearch);
    });

    return {
      ...data,
      features: filteredFeatures,
    };
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
    <div className="flex flex-col h-full bg-white dark:bg-[#141414] rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800 relative">
      <Map
        viewport={{
          center: [106.6881, 20.8449],
          zoom: 11,
        }}
        minZoom={1}
        maxZoom={16}
        styles={{
          light: SATELLITE_MAP_STYLE as any,
          dark: SATELLITE_MAP_STYLE as any,
        }}
      >
        <MapControls />
        <CameraMapLayers
          geojson={filteredGeojson}
          onCameraClick={setSelectedCamera}
        />
      </Map>

      {/* Overlays */}
      <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-2">
        <Input.Search
          placeholder="Tìm kiếm điểm lắp đặt..."
          allowClear
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onSearch={setSearchVal}
          className="shadow-sm"
          size="large"
        />

        <div className="bg-white/90 dark:bg-[#1f1f1f]/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 text-sm">
          <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
            Chú giải ({data?.features?.length || 0} camera)
          </div>
          <div className="flex flex-col gap-1.5">
            {stats.map(([type, count]) => {
              const color = TYPE_COLORS[type] || DEFAULT_COLOR;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <Text className="text-xs">{type}</Text>
                  </div>
                  <Badge count={count} color="#f0f0f0" style={{ color: "#595959" }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        title="Thông tin Camera"
        open={!!selectedCamera}
        onCancel={() => setSelectedCamera(null)}
        footer={null}
        width={600}
      >
        {selectedCamera && (
          <Descriptions column={1} bordered size="small" className="mt-4">
            <Descriptions.Item label="STT">{selectedCamera.id}</Descriptions.Item>
            <Descriptions.Item label="Điểm lắp đặt">{selectedCamera.name}</Descriptions.Item>
            <Descriptions.Item label="Loại">{selectedCamera.type}</Descriptions.Item>
            <Descriptions.Item label="Hướng">{selectedCamera.direction}</Descriptions.Item>
            <Descriptions.Item label="HT. 33 camera cũ">{selectedCamera.oldSystem}</Descriptions.Item>
            <Descriptions.Item label="Cáp quang/ Mạng">{selectedCamera.network}</Descriptions.Item>
            <Descriptions.Item label="Điện/ Tủ điện">{selectedCamera.power}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{selectedCamera.note}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">{selectedCamera.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
