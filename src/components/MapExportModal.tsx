import {
  CompressOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  DPI,
  type DPIType,
  Format,
  type FormatType,
  MapGenerator,
  PrintableAreaManager,
  type SizeType,
} from "@watergis/maplibre-gl-export";
import { Button, Checkbox, Modal, Radio, Select, Typography, message } from "antd";
import { toPng } from "html-to-image";
import type { Map as MaplibreMap } from "maplibre-gl";
import React from "react";

interface IMapExportModalProps {
  open: boolean;
  mapInstance: MaplibreMap | null;
  onClose: () => void;
  defaultFileName?: string;
}

interface IAspectRatioOption {
  key: string;
  label: string;
  ratioText: string;
  widthPx?: number;
  heightPx?: number;
  widthMm?: number;
  heightMm?: number;
}

type LabelScaleType = "auto" | "small" | "medium" | "large";

const RATIO_OPTIONS: IAspectRatioOption[] = [
  {
    key: "current_screen",
    label: "Khung nhìn hiện tại (Toàn màn hình — 4K Sắc nét)",
    ratioText: "Khung nhìn",
    widthPx: 3840,
    heightPx: 2160,
  },
  {
    key: "16_9",
    label: "4K Ultra HD (3840 x 2160 px — 16:9)",
    ratioText: "16:9 4K",
    widthPx: 3840,
    heightPx: 2160,
  },
  {
    key: "4_3",
    label: "4K Tiêu chuẩn (2880 x 2160 px — 4:3)",
    ratioText: "4:3 4K",
    widthPx: 2880,
    heightPx: 2160,
  },
  {
    key: "1_1",
    label: "4K Vuông (3840 x 3840 px — 1:1)",
    ratioText: "1:1 4K",
    widthPx: 3840,
    heightPx: 3840,
  },
  {
    key: "21_9",
    label: "4K Ultrawide (3840 x 1645 px — 21:9)",
    ratioText: "21:9 4K",
    widthPx: 3840,
    heightPx: 1645,
  },
  {
    key: "9_16",
    label: "4K Dọc Story (2160 x 3840 px — 9:16)",
    ratioText: "9:16 4K",
    widthPx: 2160,
    heightPx: 3840,
  },
  {
    key: "8k_16_9",
    label: "8K Ultra HD (7680 x 4320 px — 16:9)",
    ratioText: "16:9 8K",
    widthPx: 7680,
    heightPx: 4320,
  },
  {
    key: "8k_4_3",
    label: "8K Tiêu chuẩn (5760 x 4320 px — 4:3)",
    ratioText: "4:3 8K",
    widthPx: 5760,
    heightPx: 4320,
  },
  {
    key: "8k_1_1",
    label: "8K Vuông (7680 x 7680 px — 1:1)",
    ratioText: "1:1 8K",
    widthPx: 7680,
    heightPx: 7680,
  },
  {
    key: "a4_landscape",
    label: "A4 Ngang (297 x 210 mm)",
    ratioText: "A4 Ngang",
    widthMm: 297,
    heightMm: 210,
  },
  {
    key: "a4_portrait",
    label: "A4 Dọc (210 x 297 mm)",
    ratioText: "A4 Dọc",
    widthMm: 210,
    heightMm: 297,
  },
  {
    key: "a3_landscape",
    label: "A3 Ngang (420 x 297 mm)",
    ratioText: "A3 Ngang",
    widthMm: 420,
    heightMm: 297,
  },
  {
    key: "a3_portrait",
    label: "A3 Dọc (297 x 420 mm)",
    ratioText: "A3 Dọc",
    widthMm: 297,
    heightMm: 420,
  },
  {
    key: "a2_landscape",
    label: "A2 Ngang (594 x 420 mm)",
    ratioText: "A2 Ngang",
    widthMm: 594,
    heightMm: 420,
  },
  {
    key: "a1_landscape",
    label: "A1 Ngang (841 x 594 mm)",
    ratioText: "A1 Ngang",
    widthMm: 841,
    heightMm: 594,
  },
  {
    key: "a0_landscape",
    label: "A0 Ngang (1189 x 841 mm — Khổ cực đại)",
    ratioText: "A0 Ngang",
    widthMm: 1189,
    heightMm: 841,
  },
];

const DEFAULT_DISTRICT_COLORS: Record<string, string> = {
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

const DEFAULT_DISTRICT_NAMES: Record<string, string> = {
  AnBien: "An Biên",
  AnDuong: "An Dương",
  AnHai: "An Hải",
  AnPhong: "An Phong",
  AnThanh: "An Thạnh",
  GiaVien: "Gia Viên",
  HongAn: "Hồng An",
  HongBang: "Hồng Bàng",
  HungDao: "Hưng Đạo",
  KienAn: "Kiến An",
  KimThanh: "Kim Thành",
  LeChan: "Lê Chân",
  NgoQuyen: "Ngô Quyền",
  PhuLien: "Phù Liễn",
  PhuThai: "Phú Thái",
};

const EXPORT_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function drawCanvasTitleOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  scaleFactor: number,
  titleText = "PHÒNG CẢNH SÁT GIAO THÔNG - CATP HẢI PHÒNG",
  subtitleText = "BẢN ĐỒ ĐỊA BÀN ĐỘI CSGTĐB SỐ 2",
) {
  const fontTitleSize = Math.round(30 * scaleFactor);
  const fontSubtitleSize = Math.round(40 * scaleFactor);
  const lineSpacing = Math.round(14 * 1 * scaleFactor);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `bold ${fontTitleSize}px ${EXPORT_FONT_FAMILY}`;
  const titleMetrics = ctx.measureText(titleText);

  ctx.font = `bold ${fontSubtitleSize}px ${EXPORT_FONT_FAMILY}`;
  const subtitleMetrics = ctx.measureText(subtitleText);

  const textWidth = Math.max(titleMetrics.width, subtitleMetrics.width);
  const paddingX = 32 * scaleFactor;
  const paddingY = 18 * scaleFactor;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = fontTitleSize + fontSubtitleSize + paddingY * 2 + lineSpacing;

  const boxX = (canvasWidth - boxWidth) / 2;
  const boxY = 24 * scaleFactor;
  const radius = 12 * scaleFactor;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
  } else {
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
  }
  ctx.clip();
  if ("filter" in ctx) {
    ctx.filter = `blur(${Math.round(10 * scaleFactor)}px)`;
    ctx.drawImage(ctx.canvas, boxX, boxY, boxWidth, boxHeight, boxX, boxY, boxWidth, boxHeight);
    ctx.filter = "none";
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.40)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, 1.5 * scaleFactor);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.stroke();
  ctx.restore();

  ctx.font = `bold ${fontTitleSize}px ${EXPORT_FONT_FAMILY}`;
  ctx.fillStyle = "#ffffff";
  const titleY = boxY + paddingY + fontTitleSize / 2;
  ctx.fillText(titleText, canvasWidth / 2, titleY);

  ctx.font = `bold ${fontSubtitleSize}px ${EXPORT_FONT_FAMILY}`;
  ctx.fillStyle = "#ffffff";
  const subtitleY = titleY + fontTitleSize / 2 + lineSpacing + fontSubtitleSize / 2;
  ctx.fillText(subtitleText, canvasWidth / 2, subtitleY);

  ctx.restore();
}

function drawCanvasLegendOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  scaleFactor: number,
  districtColors: Record<string, string> = DEFAULT_DISTRICT_COLORS,
) {
  const districts = Object.entries(districtColors);
  if (districts.length === 0) return;

  const fontSize = Math.round(12 * scaleFactor);
  const headerFontSize = Math.round(14 * scaleFactor);
  const padding = 16 * scaleFactor;
  const itemHeight = Math.round(12 * 1.5 * scaleFactor);
  const lineSpacing = Math.round(12 * 0.5 * scaleFactor);
  const boxWidth = 250 * scaleFactor;

  ctx.save();

  const rows = Math.ceil(districts.length / 2);
  const contentHeight =
    headerFontSize +
    lineSpacing +
    fontSize +
    lineSpacing +
    rows * itemHeight +
    itemHeight + 8 * scaleFactor;

  const boxHeight = contentHeight + padding;
  const boxX = canvasWidth - boxWidth - 24 * scaleFactor;
  const boxY = canvasHeight - boxHeight - 24 * scaleFactor;
  const radius = 12 * scaleFactor;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
  } else {
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
  }
  ctx.clip();
  if ("filter" in ctx) {
    ctx.filter = `blur(${Math.round(10 * scaleFactor)}px)`;
    ctx.drawImage(ctx.canvas, boxX, boxY, boxWidth, boxHeight, boxX, boxY, boxWidth, boxHeight);
    ctx.filter = "none";
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.40)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, 1.5 * scaleFactor);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.stroke();
  ctx.restore();

  let drawY = boxY + padding;

  ctx.font = `${headerFontSize}px ${EXPORT_FONT_FAMILY}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Ký Hiệu", boxX + padding, drawY);

  drawY += headerFontSize + lineSpacing;

  ctx.font = `${fontSize}px ${EXPORT_FONT_FAMILY}`;
  ctx.fillStyle = "#cbd5e1";
  drawY += fontSize + lineSpacing;

  const colWidth = (boxWidth - padding * 2) / 2;
  districts.forEach(([id, color], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const itemX = boxX + padding + col * colWidth;
    const itemY = drawY + row * itemHeight;

    ctx.fillStyle = color;
    const swatchSize = 14 * scaleFactor;
    ctx.fillRect(itemX, itemY + 1 * scaleFactor, swatchSize, swatchSize);
    ctx.lineWidth = Math.max(1, scaleFactor);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.strokeRect(itemX, itemY + 1 * scaleFactor, swatchSize, swatchSize);

    ctx.fillStyle = "#f8fafc";
    ctx.font = `normal ${fontSize}px ${EXPORT_FONT_FAMILY}`;
    const name = DEFAULT_DISTRICT_NAMES[id] || id;
    ctx.fillText(name, itemX + swatchSize + 20 * scaleFactor, itemY);
  });

  ctx.fillStyle = "#f8fafc";
  ctx.font = `normal ${fontSize}px ${EXPORT_FONT_FAMILY}`;

  ctx.restore();
}

export function MapExportModal({
  open,
  mapInstance,
  onClose,
  defaultFileName = "",
}: IMapExportModalProps) {
  const [selectedRatioKey, setSelectedRatioKey] = React.useState<string>("16_9");
  const [format, setFormat] = React.useState<FormatType>(Format.PNG);
  const [dpi, setDpi] = React.useState<number>(DPI[400]);
  const [exporting, setExporting] = React.useState<boolean>(false);
  const [showPrintableArea, setShowPrintableArea] = React.useState<boolean>(true);

  const [labelScale, setLabelScale] = React.useState<LabelScaleType>("auto");
  const [avoidOverlap, setAvoidOverlap] = React.useState<boolean>(true);
  const [showCommuneLabels, setShowCommuneLabels] = React.useState<boolean>(true);
  const [showTeamLabels, setShowTeamLabels] = React.useState<boolean>(true);
  const [showRouteLabels, setShowRouteLabels] = React.useState<boolean>(true);

  const selectedOption = React.useMemo(
    () => RATIO_OPTIONS.find((item) => item.key === selectedRatioKey) || RATIO_OPTIONS[0],
    [selectedRatioKey],
  );

  React.useEffect(() => {
    if (!open || !mapInstance || !showPrintableArea) return;

    const printableAreaManager = new PrintableAreaManager(mapInstance);

    const updatePreviewArea = () => {
      const canvas = mapInstance.getCanvas();
      const canvasW = canvas?.clientWidth || 1000;
      const canvasH = canvas?.clientHeight || 800;

      let boxW = 0;
      let boxH = 0;

      if (selectedOption.key === "current_screen") {
        boxW = canvasW;
        boxH = canvasH;
      } else {
        let ratio = 16 / 9;
        if (selectedOption.widthMm && selectedOption.heightMm) {
          ratio = selectedOption.widthMm / selectedOption.heightMm;
        } else if (selectedOption.widthPx && selectedOption.heightPx) {
          ratio = selectedOption.widthPx / selectedOption.heightPx;
        }

        if (canvasW / canvasH > ratio) {
          boxH = canvasH * 0.82;
          boxW = boxH * ratio;
        } else {
          boxW = canvasW * 0.82;
          boxH = boxW / ratio;
        }
      }

      const widthMm = boxW * (25.4 / 96);
      const heightMm = boxH * (25.4 / 96);

      printableAreaManager.updateArea(widthMm, heightMm);
    };

    updatePreviewArea();

    mapInstance.on("resize", updatePreviewArea);

    return () => {
      mapInstance.off("resize", updatePreviewArea);
      printableAreaManager.destroy();
    };
  }, [open, mapInstance, showPrintableArea, selectedOption]);

  const handleExport = React.useCallback(async () => {
    if (!mapInstance) {
      message.error("Chưa kết nối được với bản đồ!");
      return;
    }

    setExporting(true);
    const hideLoading = message.loading("Đang kết xuất bản đồ...", 0);

    try {
      const canvas = mapInstance.getCanvas();
      const canvasW = canvas?.clientWidth || 1000;
      const canvasH = canvas?.clientHeight || 800;

      let boxW = 0;
      let boxH = 0;
      let targetWidthPx = 3840;
      let targetHeightPx = 2160;

      if (selectedOption.key === "current_screen") {
        boxW = canvasW;
        boxH = canvasH;
        targetWidthPx = 3840;
        targetHeightPx = Math.round(3840 / (canvasW / canvasH));
      } else {
        let ratio = 16 / 9;
        if (selectedOption.widthMm && selectedOption.heightMm) {
          ratio = selectedOption.widthMm / selectedOption.heightMm;
          targetWidthPx = Math.round((selectedOption.widthMm / 25.4) * dpi);
          targetHeightPx = Math.round((selectedOption.heightMm / 25.4) * dpi);
        } else if (selectedOption.widthPx && selectedOption.heightPx) {
          ratio = selectedOption.widthPx / selectedOption.heightPx;
          targetWidthPx = selectedOption.widthPx;
          targetHeightPx = selectedOption.heightPx;
        }

        if (canvasW / canvasH > ratio) {
          boxH = canvasH * 0.82;
          boxW = boxH * ratio;
        } else {
          boxW = canvasW * 0.82;
          boxH = boxW / ratio;
        }
      }

      const widthMm = boxW * (25.4 / 96);
      const heightMm = boxH * (25.4 / 96);
      const scaleFactor = targetWidthPx / boxW;
      const generatorDpi = Math.max(72, Math.round(scaleFactor * 96));

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const autoFileName = defaultFileName || `${year}${month}${day}${hours}${minutes}${seconds}`;

      let communeTextSize = 7.0;
      let communeIconSize = 0.38;
      if (labelScale === "small") {
        communeTextSize = 5.5;
        communeIconSize = 0.3;
      } else if (labelScale === "medium") {
        communeTextSize = 7.5;
        communeIconSize = 0.42;
      } else if (labelScale === "large") {
        communeTextSize = 9.5;
        communeIconSize = 0.5;
      }

      const generator = new MapGenerator(mapInstance, {
        format: format,
        size: [widthMm, heightMm] as SizeType,
        unit: "mm",
        dpi: generatorDpi as DPIType,
        fileName: autoFileName,
        download: true,
      });

      const applyLayerCustomizations = (renderMap: MaplibreMap) => {
        try {
          const layers = renderMap.getStyle()?.layers;
          if (layers) {
            for (const layer of layers) {
              if (layer.id.includes("area-label-centers")) {
                if (!showCommuneLabels) {
                  renderMap.setLayoutProperty(layer.id, "visibility", "none");
                } else {
                  renderMap.setLayoutProperty(layer.id, "visibility", "visible");
                  renderMap.setLayoutProperty(layer.id, "text-size", communeTextSize);
                  renderMap.setLayoutProperty(layer.id, "icon-size", communeIconSize);
                  renderMap.setLayoutProperty(layer.id, "text-allow-overlap", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "text-ignore-placement", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "icon-allow-overlap", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "icon-ignore-placement", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "text-optional", avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "text-padding", avoidOverlap ? 3 : 1);
                  renderMap.setLayoutProperty(layer.id, "text-variable-anchor", ["left", "right", "top", "bottom"]);
                  renderMap.setLayoutProperty(layer.id, "text-radial-offset", 0.45);
                }
              } else if (layer.id.includes("team-label-centers")) {
                if (!showTeamLabels) {
                  renderMap.setLayoutProperty(layer.id, "visibility", "none");
                } else {
                  renderMap.setLayoutProperty(layer.id, "visibility", "visible");
                  renderMap.setLayoutProperty(layer.id, "text-size", 20);
                  renderMap.setLayoutProperty(layer.id, "text-allow-overlap", true);
                  renderMap.setLayoutProperty(layer.id, "text-ignore-placement", true);
                }
              } else if (layer.id.includes("route") && layer.type === "symbol") {
                if (!showRouteLabels) {
                  renderMap.setLayoutProperty(layer.id, "visibility", "none");
                } else {
                  renderMap.setLayoutProperty(layer.id, "visibility", "visible");
                  renderMap.setLayoutProperty(layer.id, "text-size", 5.5);
                  renderMap.setLayoutProperty(layer.id, "text-allow-overlap", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "text-ignore-placement", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "icon-allow-overlap", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "icon-ignore-placement", !avoidOverlap);
                  renderMap.setLayoutProperty(layer.id, "symbol-spacing", 220);
                }
              }
            }
          }
        } catch (e) {
          console.warn("Could not adjust renderMap symbol properties:", e);
        }
      };

      const generatorAny = generator as unknown as {
        renderMapPost: (renderMap: MaplibreMap) => MaplibreMap;
        composeCanvas: (renderMap: MaplibreMap) => Promise<HTMLCanvasElement>;
        getMarkers: () => HTMLCollectionOf<Element>;
        renderMarkers: (renderMap: MaplibreMap) => MaplibreMap;
      };

      generatorAny.getMarkers = () => [] as unknown as HTMLCollectionOf<Element>;
      generatorAny.renderMarkers = (renderMap: MaplibreMap) => renderMap;

      generatorAny.renderMapPost = (renderMap: MaplibreMap) => {
        applyLayerCustomizations(renderMap);
        return renderMap;
      };

      const originalComposeCanvas = generatorAny.composeCanvas.bind(generator);

      generatorAny.composeCanvas = async (renderMap: MaplibreMap) => {
        if (renderMap) {
          applyLayerCustomizations(renderMap);

          try {
            const style = renderMap.getStyle();
            if (style?.layers) {
              for (const layer of style.layers) {
                if (/^point\d+$/.test(layer.id)) {
                  if (renderMap.getLayer(layer.id)) renderMap.removeLayer(layer.id);
                  if (renderMap.getSource(layer.id)) renderMap.removeSource(layer.id);
                }
              }
            }
          } catch (e) {
            console.warn("Could not remove marker layers from export:", e);
          }

          if (!renderMap.areTilesLoaded()) {
            await new Promise<void>((resolve) => {
              const check = () => {
                if (renderMap.areTilesLoaded()) {
                  renderMap.off("render", check);
                  resolve();
                }
              };
              renderMap.on("render", check);
              setTimeout(resolve, 3000);
            });
          }
        }

        const exportCanvas = await originalComposeCanvas(renderMap);
        const ctx = exportCanvas.getContext("2d");
        if (!ctx) return exportCanvas;

        const sourceMapContainer = mapInstance.getContainer();
        const mapRect = sourceMapContainer.getBoundingClientRect();
        const scaleX = exportCanvas.width / mapRect.width;
        const scaleY = exportCanvas.height / mapRect.height;

        let titleDrawn = false;
        let legendDrawn = false;

        const titleEl = document.querySelector('[data-export-overlay="title"]') as HTMLElement | null;
        if (titleEl && titleEl.offsetHeight > 0) {
          try {
            const titleDataUrl = await toPng(titleEl, {
              pixelRatio: Math.max(scaleX, 2),
              cacheBust: true,
            });
            const titleImg = new Image();
            titleImg.src = titleDataUrl;
            await titleImg.decode();

            const titleRect = titleEl.getBoundingClientRect();
            const posX = (titleRect.left - mapRect.left) * scaleX;
            const posY = (titleRect.top - mapRect.top) * scaleY;
            const drawW = titleRect.width * scaleX;
            const drawH = titleRect.height * scaleY;

            ctx.drawImage(titleImg, posX, posY, drawW, drawH);
            titleDrawn = true;
          } catch (e) {
            console.warn("Could not capture title overlay via toPng:", e);
          }
        }

        if (!titleDrawn) {
          // drawCanvasTitleOverlay(ctx, exportCanvas.width, scaleX);
        }

        const legendEl = document.querySelector('[data-export-overlay="legend"]') as HTMLElement | null;
        if (legendEl && legendEl.offsetHeight > 0) {
          try {
            const legendDataUrl = await toPng(legendEl, {
              pixelRatio: Math.max(scaleX, 2),
              cacheBust: true,
            });
            const legendImg = new Image();
            legendImg.src = legendDataUrl;
            await legendImg.decode();

            const legendRect = legendEl.getBoundingClientRect();
            const posX = (legendRect.left - mapRect.left) * scaleX;
            const posY = (legendRect.top - mapRect.top) * scaleY;
            const drawW = legendRect.width * scaleX;
            const drawH = legendRect.height * scaleY;

            ctx.drawImage(legendImg, posX, posY, drawW, drawH);
            legendDrawn = true;
          } catch (e) {
            console.warn("Could not capture legend overlay via toPng:", e);
          }
        }

        if (!legendDrawn) {
          // drawCanvasLegendOverlay(ctx, exportCanvas.width, exportCanvas.height, scaleX);
        }

        return exportCanvas;
      };

      await generator.generate();
      hideLoading();
      message.success("Xuất bản đồ thành công!");
      onClose();
    } catch (error) {
      hideLoading();
      console.error("Lỗi xuất bản đồ:", error);
      message.error("Có lỗi xảy ra khi xuất bản đồ.");
    } finally {
      setExporting(false);
    }
  }, [
    mapInstance,
    format,
    selectedOption,
    dpi,
    defaultFileName,
    labelScale,
    avoidOverlap,
    showCommuneLabels,
    showTeamLabels,
    showRouteLabels,
    onClose,
  ]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <DownloadOutlined className="text-blue-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">Xuất Bản Đồ</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      mask={false}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={exporting}>
          Hủy
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
          className="bg-blue-600! hover:bg-blue-500!"
        >
          Xuất bản đồ
        </Button>,
      ]}
      width={560}
      centered
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Frame / Aspect Ratio */}
        <div>
          <Typography.Text className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Tỉ lệ khung hình / Kích thước:
          </Typography.Text>
          <Select
            value={selectedRatioKey}
            onChange={(value) => setSelectedRatioKey(value)}
            className="w-full"
            options={RATIO_OPTIONS.map((item) => ({
              label: item.label,
              value: item.key,
            }))}
          />
        </div>

        {/* Format Selection */}
        <div>
          <Typography.Text className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Định dạng file:
          </Typography.Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full grid grid-cols-4 gap-2"
          >
            <Radio.Button value={Format.PNG} className="text-center text-xs">
              <span className="flex items-center justify-center gap-1">
                <FileImageOutlined /> PNG
              </span>
            </Radio.Button>
            <Radio.Button value={Format.JPEG} className="text-center text-xs">
              JPEG
            </Radio.Button>
            <Radio.Button value={Format.PDF} className="text-center text-xs">
              <span className="flex items-center justify-center gap-1">
                <FilePdfOutlined /> PDF
              </span>
            </Radio.Button>
            <Radio.Button value={Format.SVG} className="text-center text-xs">
              SVG
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* DPI Selection (for mm formats) or Info */}
        <div>
          <Typography.Text className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Độ phân giải (DPI):
          </Typography.Text>
          <Select
            value={dpi}
            onChange={(value) => setDpi(value)}
            className="w-full"
            options={[
              { label: "600 DPI (Cực kỳ sắc nét)", value: 600 },
              { label: "500 DPI (Rất cao)", value: 500 },
              { label: "400 DPI (Sắc nét)", value: 400 },
              { label: "300 DPI (Tiêu chuẩn in ấn)", value: 300 },
              { label: "200 DPI (Tiêu chuẩn màn hình)", value: 200 },
              { label: "150 DPI (Trung bình)", value: 150 },
              { label: "96 DPI (Nhanh)", value: 96 },
            ]}
          />
        </div>

        {/* Section: Label Scaling & Collision Settings */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <SettingOutlined className="text-blue-500" />
              Tỉ lệ & Hiển thị nhãn xã / phường
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <Typography.Text className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">
                Cỡ chữ nhãn xã/phường:
              </Typography.Text>
              <Select
                value={labelScale}
                onChange={(val) => setLabelScale(val as LabelScaleType)}
                size="small"
                className="w-full text-xs"
                options={[
                  { label: "Tự động cân đối (Khuyên dùng)", value: "auto" },
                  { label: "Nhỏ gọn (5.5px — ít đè chữ)", value: "small" },
                  { label: "Tiêu chuẩn (7.5px)", value: "medium" },
                  { label: "Lớn / Rõ nét (9.5px)", value: "large" },
                ]}
              />
            </div>

            <div className="pt-4">
              <Checkbox
                checked={avoidOverlap}
                onChange={(e) => setAvoidOverlap(e.target.checked)}
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Tự động chống chồng lấn nhãn
              </Checkbox>
            </div>
          </div>

          <div>
            <Typography.Text className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">
              Lớp nhãn muốn hiển thị:
            </Typography.Text>
            <div className="flex items-center gap-4 flex-wrap">
              <Checkbox
                checked={showCommuneLabels}
                onChange={(e) => setShowCommuneLabels(e.target.checked)}
                className="text-xs"
              >
                Xã / Phường
              </Checkbox>
              <Checkbox
                checked={showTeamLabels}
                onChange={(e) => setShowTeamLabels(e.target.checked)}
                className="text-xs"
              >
                Tên Đội CSGT
              </Checkbox>
              <Checkbox
                checked={showRouteLabels}
                onChange={(e) => setShowRouteLabels(e.target.checked)}
                className="text-xs"
              >
                Tuyến đường
              </Checkbox>
            </div>
          </div>
        </div>

        <div>
          <Checkbox
            checked={showPrintableArea}
            onChange={(e) => setShowPrintableArea(e.target.checked)}
            className="text-xs"
          >
            Hiển thị khung xem trước vị trí xuất trên bản đồ
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
}
