import { Badge, ConfigProvider, Input, Modal, Select, Spin, Switch, Typography } from "antd";
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
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";

interface ISelectedBenBai {
  properties: IBenBaiProperties;
  coordinates: [number, number];
}

const TEAMS = [
  { id: "Bạch Đằng", label: "Thủy đội Bạch Đằng", color: "#38bdf8" },
  { id: "ĐT1", label: "Thủy đội 1 (ĐT1)", color: "#facc15" },
  { id: "ĐT2", label: "Thủy đội 2 (ĐT2)", color: "#4ade80" },
  { id: "Chưa gán đơn vị", label: "Chưa gán đơn vị", color: "#94a3b8" },
];

const DEFAULT_COLOR = "#94a3b8";

const TEAM_COLORS: Record<string, string> = Object.fromEntries(TEAMS.map((team) => [team.id, team.color]));

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
    if (!isLoaded) return;
    if (!map) return;
    if (!geojson) return;

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

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 6.5],
          "circle-color": [
            "match",
            ["get", "managementTeam"],
            "Bạch Đằng",
            TEAM_COLORS["Bạch Đằng"],
            "ĐT1",
            TEAM_COLORS["ĐT1"],
            "ĐT2",
            TEAM_COLORS["ĐT2"],
            DEFAULT_COLOR,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });
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

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-[13px]">{label}</span>
      <span className="text-slate-800 text-[13px] font-medium wrap-break-word whitespace-pre-wrap">
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function InfoSection({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="flex flex-col">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 mt-4 first:mt-0">
        {title}
      </h3>
      <div className="bg-slate-50 rounded-lg px-4 border border-slate-100">{children}</div>
    </section>
  );
}

function PhoneLink({ phone }: { phone?: string }) {
  if (!phone) return null;
  return (
    <a href={`tel:${phone}`} className="text-blue-600! hover:underline">
      {phone}
    </a>
  );
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
              tip={<span className="text-white font-medium mt-2 block">Đang tải dữ liệu bến bãi...</span>}
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
                  <span className="mt-1 text-[10px] font-bold text-slate-100 whitespace-nowrap bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 max-w-48 truncate">
                    {selectedBenBai.properties.name}
                  </span>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-3">
            <div className="bg-black/50 backdrop-blur-md border border-white/15 shadow-2xl rounded-xl p-3 relative flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-slate-300">ĐƠN VỊ QUẢN LÝ</div>
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
              </div>

              <Input
                allowClear
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm tên bến, chủ bến, SĐT, vị trí..."
                className="bg-black/40! border-white/10! hover:border-white/20! focus:border-blue-500! text-white! text-xs py-1.5 px-3 rounded-lg [&_input]:text-white! [&_input::placeholder]:text-slate-300! [&_.ant-input-clear-icon]:text-slate-300!"
                prefix={<SearchOutlined className="text-slate-300 mr-1 text-[13px]" />}
              />

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-black/75 backdrop-blur-lg border border-white/15 shadow-2xl rounded-xl overflow-hidden z-20 flex flex-col max-h-72 overflow-y-auto">
                  {searchResults.map((benBai: ISelectedBenBai) => (
                    <div
                      key={`search-result-${benBai.properties.id}`}
                      onClick={() => {
                        setSelectedBenBai(benBai);
                        setSearchValue("");
                        mapRef.current?.flyTo({ center: benBai.coordinates, zoom: 15, duration: 1000 });
                      }}
                      className="px-3.5 py-2 hover:bg-white/10 cursor-pointer flex flex-col gap-0.5 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="text-slate-100 font-medium text-xs truncate">{benBai.properties.name}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TEAM_COLORS[benBai.properties.managementTeam] || DEFAULT_COLOR }}
                        />
                        <span className="text-slate-400 text-[10px] font-semibold shrink-0">
                          {benBai.properties.managementUnit || "Chưa gán"}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate">{benBai.properties.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            data-export-overlay="legend"
            data-legend-collapsed={!isLegendOpen}
            className={cn(
              "absolute bottom-4 right-4 z-20 bg-black/50 text-white backdrop-blur-md border border-white/15 shadow-2xl rounded-xl text-xs font-sans leading-relaxed select-none transition-all duration-300",
              isLegendOpen ? "w-72 p-4" : "w-auto px-3 py-1.5 cursor-pointer hover:bg-black/75"
            )}
            onClick={!isLegendOpen ? () => setIsLegendOpen(true) : undefined}
          >
            <div
              className={cn(
                "flex items-center justify-between font-bold text-xs uppercase tracking-wider text-white",
                isLegendOpen && "border-b border-white/20 pb-1.5 mb-2.5"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span>CHÚ GIẢI</span>
              </div>
              <button
                type="button"
                data-legend-toggle="true"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsLegendOpen((previous) => !previous);
                }}
                className="text-slate-300 hover:text-white p-0.5 rounded transition-colors ml-2 cursor-pointer"
                title={isLegendOpen ? "Thu gọn" : "Mở rộng"}
              >
                {isLegendOpen ? <DownOutlined className="text-[10px]" /> : <UpOutlined className="text-[10px]" />}
              </button>
            </div>

            {isLegendOpen && (
              <div className="flex flex-col gap-2">
                {teamStats.map((team) => {
                  const visible = !hiddenTeams.has(team.id);
                  return (
                    <div key={team.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm transition-opacity"
                          style={{ backgroundColor: team.color, opacity: visible ? 1 : 0.3 }}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-medium truncate transition-opacity",
                            visible ? "text-slate-100" : "text-slate-400"
                          )}
                        >
                          {team.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-3 h-3 rounded-full border border-white/40 shrink-0 shadow-sm bg-white/25" />
                    <span className="text-[11px] font-bold text-slate-100 truncate">Tổng số</span>
                  </div>
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
                </div>
              </div>
            )}
          </div>
        </Map>
      </div>

      <Modal
        open={isModalOpen && !!selectedProperties}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={680}
        centered
        destroyOnHidden
        title={
          selectedProperties && (
            <div className="flex items-start gap-2.5 pr-6">
              <span
                className="w-3 h-3 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: selectedColor }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-base font-semibold text-slate-800 leading-snug">{selectedProperties.name}</span>
                <span className="text-xs font-normal text-slate-500">
                  STT {selectedProperties.stt} · {selectedProperties.managementUnit || "Chưa gán đơn vị"}
                </span>
              </div>
            </div>
          )
        }
      >
        {selectedProperties && selectedBenBai && (
          <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2 flex flex-col">
            <InfoSection title="Thông tin chung">
              <InfoRow label="Tên cảng, bến, bãi" value={selectedProperties.name} />
              <InfoRow label="SĐT cảng, bến, bãi" value={<PhoneLink phone={selectedProperties.phone} />} />
              <InfoRow label="Loại hình" value={selectedProperties.rawType} />
              <InfoRow label="Địa điểm" value={selectedProperties.location} />
              <InfoRow
                label="Tình trạng"
                value={
                  <span
                    className="font-semibold"
                    style={{ color: STATUS_COLORS[selectedProperties.operatingStatus] || DEFAULT_COLOR }}
                  >
                    {selectedProperties.operatingStatus}
                  </span>
                }
              />
              <InfoRow label="Đơn vị quản lý" value={selectedProperties.managementUnit} />
            </InfoSection>

            <InfoSection title="Chủ cảng, bến, bãi">
              <InfoRow label="Chủ sở hữu" value={selectedProperties.owner} />
              <InfoRow label="Số điện thoại" value={<PhoneLink phone={selectedProperties.ownerPhone} />} />
            </InfoSection>

            <InfoSection title="Vật liệu xây dựng, hàng hoá">
              <InfoRow label="Cát sỏi" value={selectedProperties.materialsSand} />
              <InfoRow label="Khoáng sản khác" value={selectedProperties.materialsMineral} />
              <InfoRow label="Hàng hoá khác" value={selectedProperties.materialsOther} />
            </InfoSection>

            <InfoSection title="Giấy phép">
              <InfoRow
                label="Tình trạng"
                value={
                  <span
                    className="font-semibold"
                    style={{ color: PERMIT_COLORS[selectedProperties.permitStatus] || DEFAULT_COLOR }}
                  >
                    {selectedProperties.permitStatus}
                  </span>
                }
              />
              <InfoRow label="Số giấy phép" value={selectedProperties.permitNumber} />
              <InfoRow label="Thời hạn" value={selectedProperties.permitExpiry} />
            </InfoSection>

            <InfoSection title="Lực lượng phụ trách">
              <InfoRow
                label="Cán bộ phụ trách"
                value={
                  <span className="flex flex-col">
                    <span>{selectedProperties.officerName || "—"}</span>
                    <PhoneLink phone={selectedProperties.officerPhone} />
                  </span>
                }
              />
              <InfoRow
                label="Chỉ huy phụ trách"
                value={
                  <span className="flex flex-col">
                    <span>{selectedProperties.commanderName || "—"}</span>
                    <PhoneLink phone={selectedProperties.commanderPhone} />
                  </span>
                }
              />
              <InfoRow
                label="Lãnh đạo phụ trách"
                value={
                  <span className="flex flex-col">
                    <span>{selectedProperties.leaderName || "—"}</span>
                    <PhoneLink phone={selectedProperties.leaderPhone} />
                  </span>
                }
              />
            </InfoSection>

            <InfoSection title="Vị trí">
              <InfoRow label="Toạ độ (lat, lon)" value={selectedProperties.coordinatesStr} />
              <InfoRow
                label="Link vị trí (gốc)"
                value={
                  selectedProperties.originalLink && (
                    <Typography.Link href={selectedProperties.originalLink} target="_blank" rel="noopener noreferrer">
                      {selectedProperties.originalLink}
                    </Typography.Link>
                  )
                }
              />
              <InfoRow
                label="Google Maps"
                value={
                  <Typography.Link
                    href={`https://www.google.com/maps?q=${selectedBenBai.coordinates[1]},${selectedBenBai.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mở trên Google Maps
                  </Typography.Link>
                }
              />
            </InfoSection>
          </div>
        )}
      </Modal>
    </div>
  );
}
