import {
  Badge,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Divider,
  Flex,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from "antd";
import React from "react";

import {
  Map,
  MapControls,
  MapFullscreenTitle,
  MapGeoJSON,
  MapMarker,
  MapRef,
  MarkerContent,
  useMap,
} from "@/components/map";
import { IBenBaiProperties } from "@/interfaces";
import { fetchBenBaiGeoJson, fetchHaiphongGeoJson, SATELLITE_MAP_STYLE } from "@/libs/cdn";
import { cn } from "@/libs/tailwind";

import {
  DownOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  PhoneOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";

interface ISelectedBenBai {
  properties: IBenBaiProperties;
  coordinates: [number, number];
}

const TEAMS = [
  { id: "Bạch Đằng", label: "Thủy đội Bạch Đằng", color: "#2563eb" },
  { id: "ĐT1", label: "Thủy đội 1 (ĐT1)", color: "#d97706" },
  { id: "ĐT2", label: "Thủy đội 2 (ĐT2)", color: "#16a34a" },
  { id: "Chưa gán đơn vị", label: "Chưa gán đơn vị", color: "#64748b" },
];

const DEFAULT_COLOR = "#64748b";

const TEAM_COLORS: Record<string, string> = Object.fromEntries(
  TEAMS.map((team) => [team.id, team.color])
);

const PERMIT_COLORS: Record<string, string> = {
  "Có phép": "#10b981",
  "Không phép": "#ef4444",
  "Hết phép": "#f59e0b",
  "Không xác định": "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  "Đang hoạt động": "#10b981",
  "Dừng hoạt động": "#ef4444",
  "Không xác định": "#94a3b8",
};

function BenBaiMapLayers({
  geojson,
  onBenBaiClick,
}: {
  geojson: any;
  onBenBaiClick: (benBai: ISelectedBenBai) => void;
}) {
  const { map, isLoaded } = useMap();

  React.useEffect(() => {
    if (!isLoaded || !map || !geojson) return;

    const sourceId = "benbai-source";
    const layerId = "benbai-layer";

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
        generateId: true,
      });
    } else {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    }

    const circleColorExpression = [
      "match",
      ["get", "managementTeam"],
      "Bạch Đằng",
      TEAM_COLORS["Bạch Đằng"],
      "ĐT1",
      TEAM_COLORS["ĐT1"],
      "ĐT2",
      TEAM_COLORS["ĐT2"],
      DEFAULT_COLOR,
    ];

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4.5, 15, 7],
          "circle-color": circleColorExpression as any,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });
    } else {
      map.setPaintProperty(layerId, "circle-color", circleColorExpression);
      map.setPaintProperty(layerId, "circle-radius", ["interpolate", ["linear"], ["zoom"], 10, 4.5, 15, 7]);
    }

    const clickHandler = (event: any) => {
      if (event.features && event.features.length > 0) {
        const feature = event.features[0];
        onBenBaiClick({
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
  }, [map, isLoaded, geojson, onBenBaiClick]);

  return null;
}

export function BenBaiMapPage() {
  const mapRef = React.useRef<MapRef>(null);
  const [data, setData] = React.useState<any>(null);
  const [haiphongBoundary, setHaiphongBoundary] = React.useState<any>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedBenBai, setSelectedBenBai] = React.useState<ISelectedBenBai | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);
  const [hiddenTeams, setHiddenTeams] = React.useState<Set<string>>(new Set());
  const [isLegendOpen, setIsLegendOpen] = React.useState(true);

  React.useEffect(() => {
    fetchBenBaiGeoJson()
      .then((response) => {
        setData(response);
      })
      .catch((error) => {
        console.error("Failed to load BenBai GeoJSON", error);
      });

    fetchHaiphongGeoJson()
      .then((response) => {
        setHaiphongBoundary(response);
      })
      .catch((error) => {
        console.error("Failed to load Hải Phòng boundary GeoJSON", error);
      });
  }, []);

  const handleBenBaiClick = React.useCallback((benBai: ISelectedBenBai) => {
    setSelectedBenBai(benBai);
    setIsModalOpen(true);
  }, []);

  const teamFilteredFeatures = React.useMemo(() => {
    if (!data) return [];
    if (!selectedTeam) return data.features;
    return data.features.filter((feature: any) => feature.properties.managementTeam === selectedTeam);
  }, [data, selectedTeam]);

  const filteredGeojson = React.useMemo(() => {
    if (!data) return null;
    let features = teamFilteredFeatures;
    if (hiddenTeams.size > 0) {
      features = features.filter((feature: any) => !hiddenTeams.has(feature.properties.managementTeam));
    }
    return { ...data, features };
  }, [data, teamFilteredFeatures, hiddenTeams]);

  const searchResults = React.useMemo(() => {
    if (!filteredGeojson || !searchValue.trim()) return [];

    const lowerSearch = searchValue.toLowerCase();
    return filteredGeojson.features
      .filter((feature: any) => {
        const properties = feature.properties;
        return [
          properties.name,
          properties.owner,
          properties.ownerPhone,
          properties.phone,
          properties.location,
          properties.permitNumber,
          properties.managementUnit,
        ].some((value) => (value || "").toLowerCase().includes(lowerSearch));
      })
      .slice(0, 8)
      .map((feature: any) => ({
        properties: feature.properties,
        coordinates: feature.geometry.coordinates,
      }));
  }, [filteredGeojson, searchValue]);

  const teamStats = React.useMemo(() => {
    const teamCounts: Record<string, number> = {};
    const unitCounts: Record<string, Record<string, number>> = {};
    for (const feature of teamFilteredFeatures) {
      const team = feature.properties.managementTeam || "Chưa gán đơn vị";
      const unit = feature.properties.managementUnit || "";
      teamCounts[team] = (teamCounts[team] || 0) + 1;
      if (unit && unit !== team) {
        unitCounts[team] = unitCounts[team] || {};
        unitCounts[team][unit] = (unitCounts[team][unit] || 0) + 1;
      }
    }
    return TEAMS.filter((team) => teamCounts[team.id]).map((team) => ({
      ...team,
      count: teamCounts[team.id],
      units: Object.entries(unitCounts[team.id] || {}).sort((first, second) => second[1] - first[1]),
    }));
  }, [teamFilteredFeatures]);

  const selectedColor = selectedBenBai
    ? TEAM_COLORS[selectedBenBai.properties.managementTeam] || DEFAULT_COLOR
    : DEFAULT_COLOR;

  const selectedProperties = selectedBenBai?.properties;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden">
      <div className="flex-1 w-full h-full relative">
        {!data && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
            <Spin
              size="large"
              tip={
                <Typography.Text className="text-white! font-medium! mt-2! block!">
                  Đang tải dữ liệu bến bãi...
                </Typography.Text>
              }
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
          <MapFullscreenTitle subtitle="BẢN ĐỒ BẾN BÃI" />

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

          <BenBaiMapLayers geojson={filteredGeojson} onBenBaiClick={handleBenBaiClick} />

          {selectedBenBai && (
            <MapMarker
              key={`selected-benbai-${selectedBenBai.properties.id}`}
              longitude={selectedBenBai.coordinates[0]}
              latitude={selectedBenBai.coordinates[1]}
              onClick={(event) => {
                event.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              <MarkerContent className="z-40 pointer-events-auto">
                <div className="flex flex-col items-center justify-center cursor-pointer group">
                  <span className="relative flex h-5 w-5 justify-center items-center">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-5 w-5 border-2 border-white shadow-md items-center justify-center"
                      style={{ backgroundColor: selectedColor }}
                    >
                      <EnvironmentOutlined className="text-white text-[10px]" />
                    </span>
                  </span>
                  <Typography.Text
                    ellipsis
                    className="mt-1! text-[10px]! font-bold! text-slate-100! bg-black/60! backdrop-blur-sm! px-1.5! py-0.5! rounded! border! border-white/10! max-w-48!"
                  >
                    {selectedBenBai.properties.name}
                  </Typography.Text>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-3">
            <Card
              size="small"
              className="bg-black/50! backdrop-blur-md! border-white/15! shadow-2xl! rounded-xl!"
              styles={{ body: { padding: 12 } }}
            >
              <Flex vertical gap={10} className="relative">
                <Flex vertical gap={4}>
                  <Typography.Text className="text-[11px]! font-semibold! text-slate-300! uppercase! tracking-wider!">
                    Đơn vị quản lý
                  </Typography.Text>
                  <ConfigProvider
                    theme={{
                      token: {
                        colorText: "#ffffff",
                        colorTextPlaceholder: "#cbd5e1",
                        colorIcon: "#cbd5e1",
                        colorBgElevated: "#0f172a",
                        colorBgContainer: "transparent",
                      },
                    }}
                  >
                    <div className="w-full bg-black/40! border border-white/10! hover:border-white/20! rounded-lg overflow-hidden flex items-center transition-colors">
                      <Select
                        allowClear
                        variant="borderless"
                        placeholder="Tất cả đơn vị"
                        value={selectedTeam}
                        onChange={(value) => setSelectedTeam(value || null)}
                        className="w-full text-xs text-white! [&_.ant-select-selector]:rounded-lg! [&_.ant-select-selection-item]:text-white! [&_.ant-select-selection-placeholder]:text-slate-300! [&_.ant-select-arrow]:text-slate-300! [&_.ant-select-clear]:text-slate-300!"
                        popupClassName="[&_.ant-select-item]:text-slate-200! [&_.ant-select-item-option-selected]:bg-blue-600/40! [&_.ant-select-item-option-selected]:text-white! [&_.ant-select-item-option-active]:bg-white/10! [&_.ant-select-item-option-active]:text-white! bg-slate-900/95! backdrop-blur-md! border! border-white/15!"
                        options={[
                          { value: "", label: "Tất cả đơn vị" },
                          ...TEAMS.map((team) => ({ value: team.id, label: team.label })),
                        ]}
                      />
                    </div>
                  </ConfigProvider>
                </Flex>

                <Input
                  allowClear
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Tìm tên bến, chủ bến, SĐT, vị trí..."
                  className="bg-black/40! border-white/10! hover:border-white/20! focus:border-blue-500! text-white! text-xs py-1.5 px-3 rounded-lg [&_input]:text-white! [&_input::placeholder]:text-slate-300! [&_.ant-input-clear-icon]:text-slate-300!"
                  prefix={<SearchOutlined className="text-slate-300 mr-1 text-[13px]" />}
                />

                {searchResults.length > 0 && (
                  <Card
                    size="small"
                    className="absolute! top-full! left-0! right-0! mt-1! bg-black/85! backdrop-blur-lg! border-white/15! shadow-2xl! rounded-xl! z-20! max-h-72! overflow-y-auto!"
                    styles={{ body: { padding: 0 } }}
                  >
                    <List
                      size="small"
                      dataSource={searchResults}
                      renderItem={(benBai: ISelectedBenBai) => (
                        <List.Item
                          key={`search-result-${benBai.properties.id}`}
                          onClick={() => {
                            setSelectedBenBai(benBai);
                            setSearchValue("");
                            mapRef.current?.flyTo({ center: benBai.coordinates, zoom: 15, duration: 1000 });
                          }}
                          className="cursor-pointer! px-3.5! py-2! hover:bg-white/10! border-b! border-white/5! last:border-0! transition-colors"
                        >
                          <Flex vertical gap={2} className="w-full min-w-0">
                            <Typography.Text ellipsis className="text-slate-100! font-medium! text-xs!">
                              {benBai.properties.name}
                            </Typography.Text>
                            <Flex align="center" gap={6} className="min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    TEAM_COLORS[benBai.properties.managementTeam] || DEFAULT_COLOR,
                                }}
                              />
                              <Typography.Text className="text-slate-400! text-[10px]! font-semibold! shrink-0">
                                {benBai.properties.managementUnit || "Chưa gán"}
                              </Typography.Text>
                              <Typography.Text ellipsis className="text-slate-400! text-[10px]!">
                                {benBai.properties.location}
                              </Typography.Text>
                            </Flex>
                          </Flex>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </Flex>
            </Card>
          </div>

          <Card
            data-export-overlay="legend"
            data-legend-collapsed={!isLegendOpen}
            size="small"
            className={cn(
              "absolute! bottom-4! right-4! z-20! bg-black/50! text-white! backdrop-blur-md! border-white/15! shadow-2xl! rounded-xl! text-xs! font-sans! leading-relaxed! select-none! transition-all! duration-300!",
              isLegendOpen ? "w-72!" : "w-auto! cursor-pointer! hover:bg-black/75!"
            )}
            styles={{
              body: {
                padding: isLegendOpen ? 16 : "6px 12px",
              },
            }}
            onClick={!isLegendOpen ? () => setIsLegendOpen(true) : undefined}
          >
            <Flex
              align="center"
              justify="space-between"
              className={cn(
                "font-bold text-xs uppercase tracking-wider text-white",
                isLegendOpen && "border-b border-white/20 pb-1.5 mb-2.5"
              )}
            >
              <Typography.Text className="text-white! font-bold! text-xs! uppercase! tracking-wider!">
                CHÚ GIẢI
              </Typography.Text>
              <Button
                type="text"
                size="small"
                data-legend-toggle="true"
                icon={isLegendOpen ? <DownOutlined className="text-[10px]!" /> : <UpOutlined className="text-[10px]!" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsLegendOpen((previous) => !previous);
                }}
                className="text-slate-300! hover:text-white! p-0! h-5! w-5! min-w-5! flex! items-center! justify-center! ml-2!"
                title={isLegendOpen ? "Thu gọn" : "Mở rộng"}
              />
            </Flex>

            {isLegendOpen && (
              <Flex vertical gap={8}>
                {teamStats.map((team) => {
                  const visible = !hiddenTeams.has(team.id);
                  return (
                    <Flex key={team.id} align="center" justify="space-between" gap={8}>
                      <Flex align="center" gap={8} className="truncate min-w-0">
                        <span
                          className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm transition-opacity"
                          style={{ backgroundColor: team.color, opacity: visible ? 1 : 0.3 }}
                        />
                        <Typography.Text
                          ellipsis
                          className={cn(
                            "text-[11px]! font-medium! truncate! transition-opacity",
                            visible ? "text-slate-100!" : "text-slate-400!"
                          )}
                        >
                          {team.label}
                        </Typography.Text>
                      </Flex>
                      <Space size={8} className="shrink-0">
                        <Badge
                          count={team.count}
                          overflowCount={99999}
                          style={{
                            backgroundColor: visible ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                            color: visible ? "#f1f5f9" : "#64748b",
                            boxShadow: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            fontSize: "10px",
                            height: "18px",
                            lineHeight: "16px",
                            minWidth: "24px",
                          }}
                        />
                        <Switch
                          size="small"
                          checked={visible}
                          onChange={(checked) => {
                            setHiddenTeams((previous) => {
                              const next = new Set(previous);
                              if (checked) next.delete(team.id);
                              else next.add(team.id);
                              return next;
                            });
                          }}
                          style={{ backgroundColor: visible ? team.color : undefined }}
                        />
                      </Space>
                    </Flex>
                  );
                })}

                <Divider className="my-1! border-white/10!" />

                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={8} className="truncate">
                    <span className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm bg-white/25" />
                    <Typography.Text className="text-[11px]! font-bold! text-slate-100! truncate!">
                      Tổng số
                    </Typography.Text>
                  </Flex>
                  <Badge
                    count={filteredGeojson?.features?.length || 0}
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
                </Flex>
              </Flex>
            )}
          </Card>
        </Map>
      </div>

      <Modal
        open={isModalOpen && Boolean(selectedProperties)}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        centered
        destroyOnHidden
        title={
          selectedProperties && (
            <Space align="center" size="small" className="pr-6">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <Typography.Title level={5} className="m-0! leading-snug text-slate-800">
                {selectedProperties.name}
              </Typography.Title>
            </Space>
          )
        }
      >
        {selectedProperties && selectedBenBai && (
          <Flex vertical gap="middle" className="max-h-[70vh] overflow-y-auto pr-1">
            <Descriptions
              title="Thông tin chung"
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: "name",
                  label: "Tên cảng, bến, bãi",
                  span: 2,
                  children: selectedProperties.name || "—",
                },
                {
                  key: "phone",
                  label: "SĐT cảng, bến, bãi",
                  children: selectedProperties.phone ? (
                    <Typography.Link href={`tel:${selectedProperties.phone}`}>
                      <Space size={4}>
                        <PhoneOutlined />
                        {selectedProperties.phone}
                      </Space>
                    </Typography.Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  key: "rawType",
                  label: "Loại hình",
                  children: selectedProperties.rawType || "—",
                },
                {
                  key: "location",
                  label: "Địa điểm",
                  span: 2,
                  children: selectedProperties.location || "—",
                },
                {
                  key: "operatingStatus",
                  label: "Tình trạng",
                  children: (
                    <Tag color={STATUS_COLORS[selectedProperties.operatingStatus] || DEFAULT_COLOR}>
                      {selectedProperties.operatingStatus || "—"}
                    </Tag>
                  ),
                },
                {
                  key: "managementUnit",
                  label: "Đơn vị quản lý",
                  children: selectedProperties.managementUnit || "—",
                },
              ]}
            />

            <Descriptions
              title="Chủ cảng, bến, bãi"
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: "owner",
                  label: "Chủ sở hữu",
                  children: selectedProperties.owner || "—",
                },
                {
                  key: "ownerPhone",
                  label: "Số điện thoại",
                  children: selectedProperties.ownerPhone ? (
                    <Typography.Link href={`tel:${selectedProperties.ownerPhone}`}>
                      <Space size={4}>
                        <PhoneOutlined />
                        {selectedProperties.ownerPhone}
                      </Space>
                    </Typography.Link>
                  ) : (
                    "—"
                  ),
                },
              ]}
            />

            <Descriptions
              title="Vật liệu xây dựng, hàng hoá"
              size="small"
              bordered
              column={{ xs: 1, sm: 3 }}
              items={[
                {
                  key: "materialsSand",
                  label: "Cát sỏi",
                  children: selectedProperties.materialsSand || "—",
                },
                {
                  key: "materialsMineral",
                  label: "Khoáng sản khác",
                  children: selectedProperties.materialsMineral || "—",
                },
                {
                  key: "materialsOther",
                  label: "Hàng hoá khác",
                  children: selectedProperties.materialsOther || "—",
                },
              ]}
            />

            <Descriptions
              title="Giấy phép"
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: "permitStatus",
                  label: "Tình trạng",
                  children: (
                    <Tag color={PERMIT_COLORS[selectedProperties.permitStatus] || DEFAULT_COLOR}>
                      {selectedProperties.permitStatus || "—"}
                    </Tag>
                  ),
                },
                {
                  key: "permitNumber",
                  label: "Số giấy phép",
                  children: selectedProperties.permitNumber || "—",
                },
                {
                  key: "permitExpiry",
                  label: "Thời hạn",
                  span: 2,
                  children: selectedProperties.permitExpiry || "—",
                },
              ]}
            />

            <Descriptions
              title="Lực lượng phụ trách"
              size="small"
              bordered
              column={{ xs: 1, sm: 1 }}
              items={[
                {
                  key: "officer",
                  label: "Cán bộ phụ trách",
                  children: (
                    <Space direction="vertical" size={2}>
                      <Typography.Text>{selectedProperties.officerName || "—"}</Typography.Text>
                      {selectedProperties.officerPhone && (
                        <Typography.Link href={`tel:${selectedProperties.officerPhone}`}>
                          <Space size={4}>
                            <PhoneOutlined />
                            {selectedProperties.officerPhone}
                          </Space>
                        </Typography.Link>
                      )}
                    </Space>
                  ),
                },
                {
                  key: "commander",
                  label: "Chỉ huy phụ trách",
                  children: (
                    <Space direction="vertical" size={2}>
                      <Typography.Text>{selectedProperties.commanderName || "—"}</Typography.Text>
                      {selectedProperties.commanderPhone && (
                        <Typography.Link href={`tel:${selectedProperties.commanderPhone}`}>
                          <Space size={4}>
                            <PhoneOutlined />
                            {selectedProperties.commanderPhone}
                          </Space>
                        </Typography.Link>
                      )}
                    </Space>
                  ),
                },
                {
                  key: "leader",
                  label: "Lãnh đạo phụ trách",
                  children: (
                    <Space direction="vertical" size={2}>
                      <Typography.Text>{selectedProperties.leaderName || "—"}</Typography.Text>
                      {selectedProperties.leaderPhone && (
                        <Typography.Link href={`tel:${selectedProperties.leaderPhone}`}>
                          <Space size={4}>
                            <PhoneOutlined />
                            {selectedProperties.leaderPhone}
                          </Space>
                        </Typography.Link>
                      )}
                    </Space>
                  ),
                },
              ]}
            />

            <Descriptions
              title="Vị trí"
              size="small"
              bordered
              column={{ xs: 1, sm: 1 }}
              items={[
                {
                  key: "coordinatesStr",
                  label: "Toạ độ (lat, lon)",
                  children: selectedProperties.coordinatesStr || "—",
                },
                {
                  key: "originalLink",
                  label: "Link vị trí (gốc)",
                  children: selectedProperties.originalLink ? (
                    <Typography.Link
                      href={selectedProperties.originalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Space size={4}>
                        <ExportOutlined />
                        {selectedProperties.originalLink}
                      </Space>
                    </Typography.Link>
                  ) : (
                    "—"
                  ),
                },
                {
                  key: "googleMaps",
                  label: "Google Maps",
                  children: (
                    <Typography.Link
                      href={`https://www.google.com/maps?q=${selectedBenBai.coordinates[1]},${selectedBenBai.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Space size={4}>
                        <EnvironmentOutlined />
                        Mở trên Google Maps
                      </Space>
                    </Typography.Link>
                  ),
                },
              ]}
            />
          </Flex>
        )}
      </Modal>
    </div>
  );
}
