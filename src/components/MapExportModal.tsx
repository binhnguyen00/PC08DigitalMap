import { DownloadOutlined, FileImageOutlined, FilePdfOutlined } from "@ant-design/icons";
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

const RATIO_OPTIONS: IAspectRatioOption[] = [
  {
    key: "8k_16_9",
    label: "8K Ultra HD (7680 × 4320 px — 16:9)",
    ratioText: "16:9 8K",
    widthPx: 7680,
    heightPx: 4320,
  },
  {
    key: "8k_4_3",
    label: "8K Tiêu chuẩn (5760 × 4320 px — 4:3)",
    ratioText: "4:3 8K",
    widthPx: 5760,
    heightPx: 4320,
  },
  {
    key: "8k_1_1",
    label: "8K Vuông (7680 × 7680 px — 1:1)",
    ratioText: "1:1 8K",
    widthPx: 7680,
    heightPx: 7680,
  },
  {
    key: "8k_21_9",
    label: "8K Ultrawide (7680 × 3290 px — 21:9)",
    ratioText: "21:9 8K",
    widthPx: 7680,
    heightPx: 3290,
  },
  {
    key: "8k_9_16",
    label: "8K Dọc Story (4320 × 7680 px — 9:16)",
    ratioText: "9:16 8K",
    widthPx: 4320,
    heightPx: 7680,
  },
  {
    key: "16_9",
    label: "4K Ultra HD (3840 × 2160 px — 16:9)",
    ratioText: "16:9 4K",
    widthPx: 3840,
    heightPx: 2160,
  },
  {
    key: "4_3",
    label: "4K Tiêu chuẩn (2880 × 2160 px — 4:3)",
    ratioText: "4:3 4K",
    widthPx: 2880,
    heightPx: 2160,
  },
  {
    key: "1_1",
    label: "4K Vuông (3840 × 3840 px — 1:1)",
    ratioText: "1:1 4K",
    widthPx: 3840,
    heightPx: 3840,
  },
  {
    key: "21_9",
    label: "4K Ultrawide (3840 × 1645 px — 21:9)",
    ratioText: "21:9 4K",
    widthPx: 3840,
    heightPx: 1645,
  },
  {
    key: "9_16",
    label: "4K Dọc Story (2160 × 3840 px — 9:16)",
    ratioText: "9:16 4K",
    widthPx: 2160,
    heightPx: 3840,
  },
  {
    key: "a0_landscape",
    label: "A0 Ngang (1189 × 841 mm — Khổ cực đại)",
    ratioText: "A0 Ngang",
    widthMm: 1189,
    heightMm: 841,
  },
  {
    key: "a1_landscape",
    label: "A1 Ngang (841 × 594 mm — Khổ bản đồ lớn)",
    ratioText: "A1 Ngang",
    widthMm: 841,
    heightMm: 594,
  },
  {
    key: "a2_landscape",
    label: "A2 Ngang (594 × 420 mm — Khổ trung)",
    ratioText: "A2 Ngang",
    widthMm: 594,
    heightMm: 420,
  },
  {
    key: "a3_landscape",
    label: "A3 Ngang (420 × 297 mm)",
    ratioText: "A3 Ngang",
    widthMm: 420,
    heightMm: 297,
  },
  {
    key: "a3_portrait",
    label: "A3 Dọc (297 × 420 mm)",
    ratioText: "A3 Dọc",
    widthMm: 297,
    heightMm: 420,
  },
  {
    key: "a4_landscape",
    label: "A4 Ngang (297 × 210 mm)",
    ratioText: "A4 Ngang",
    widthMm: 297,
    heightMm: 210,
  },
  {
    key: "a4_portrait",
    label: "A4 Dọc (210 × 297 mm)",
    ratioText: "A4 Dọc",
    widthMm: 210,
    heightMm: 297,
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

      let ratio = 16 / 9;
      if (selectedOption.widthMm && selectedOption.heightMm) {
        ratio = selectedOption.widthMm / selectedOption.heightMm;
      } else if (selectedOption.widthPx && selectedOption.heightPx) {
        ratio = selectedOption.widthPx / selectedOption.heightPx;
      }

      let boxW = 0;
      let boxH = 0;
      if (canvasW / canvasH > ratio) {
        boxH = canvasH * 0.75;
        boxW = boxH * ratio;
      } else {
        boxW = canvasW * 0.75;
        boxH = boxW / ratio;
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
      let finalSize: SizeType;
      let finalUnit: "in" | "mm" = "mm";

      if (selectedOption.widthMm && selectedOption.heightMm) {
        finalSize = [selectedOption.widthMm, selectedOption.heightMm];
        finalUnit = "mm";
      } else if (selectedOption.widthPx && selectedOption.heightPx) {
        finalSize = [selectedOption.widthPx / dpi, selectedOption.heightPx / dpi];
        finalUnit = "in";
      } else {
        finalSize = [3840 / dpi, 2160 / dpi];
        finalUnit = "in";
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const autoFileName = `${year}${month}${day}${hours}${minutes}${seconds}`;

      const generator = new MapGenerator(mapInstance, {
        format: format,
        size: finalSize,
        unit: finalUnit,
        dpi: dpi as DPIType,
        fileName: autoFileName,
        download: true,
      });

      const generatorAny = generator as unknown as {
        composeCanvas: (renderMap: MaplibreMap) => Promise<HTMLCanvasElement>;
      };
      const originalComposeCanvas = generatorAny.composeCanvas.bind(generator);

      generatorAny.composeCanvas = async (renderMap: MaplibreMap) => {
        if (renderMap) {
          try {
            const layers = renderMap.getStyle()?.layers;
            if (layers) {
              for (const layer of layers) {
                if (layer.type === "symbol") {
                  if (layer.id.includes("route")) {
                    renderMap.setLayoutProperty(layer.id, "text-size", 5);
                    renderMap.setLayoutProperty(layer.id, "icon-text-fit-padding", [0.5, 2, 0.5, 2]);
                    renderMap.setLayoutProperty(layer.id, "text-allow-overlap", true);
                    renderMap.setLayoutProperty(layer.id, "text-ignore-placement", true);
                    renderMap.setLayoutProperty(layer.id, "icon-allow-overlap", true);
                    renderMap.setLayoutProperty(layer.id, "icon-ignore-placement", true);
                    renderMap.setLayoutProperty(layer.id, "symbol-spacing", 120);
                    renderMap.setLayoutProperty(layer.id, "text-max-angle", 90);
                  } else if (layer.id.includes("area-label") || layer.id.includes("area")) {
                    renderMap.setLayoutProperty(layer.id, "text-size", 7.5);
                    renderMap.setLayoutProperty(layer.id, "icon-size", 0.45);
                    renderMap.setLayoutProperty(layer.id, "text-allow-overlap", true);
                    renderMap.setLayoutProperty(layer.id, "text-ignore-placement", true);
                    renderMap.setLayoutProperty(layer.id, "icon-allow-overlap", true);
                    renderMap.setLayoutProperty(layer.id, "icon-ignore-placement", true);
                    renderMap.setLayoutProperty(layer.id, "text-variable-anchor", ["left", "right", "top", "bottom"]);
                    renderMap.setLayoutProperty(layer.id, "text-radial-offset", 0.4);
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Could not adjust renderMap symbol properties:", e);
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
        const canvas = await originalComposeCanvas(renderMap);
        const ctx = canvas.getContext("2d");
        if (!ctx) return canvas;

        const sourceMapContainer = mapInstance.getContainer();
        const mapRect = sourceMapContainer.getBoundingClientRect();
        const scaleX = canvas.width / mapRect.width;
        const scaleY = canvas.height / mapRect.height;

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
          drawCanvasTitleOverlay(ctx, canvas.width, scaleX);
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
          drawCanvasLegendOverlay(ctx, canvas.width, canvas.height, scaleX);
        }

        return canvas;
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
  }, [mapInstance, format, selectedOption, dpi, defaultFileName, onClose]);

  return (
    <Modal
      title={<span>Xuất Bản Đồ</span>}
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
      width="50vw"
      centered
    >
      <div className="flex flex-col gap-4 py-2">
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

        <div>
          <Typography.Text className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
            Độ phân giải (DPI):
          </Typography.Text>
          <Select
            value={dpi}
            onChange={(value) => setDpi(value)}
            className="w-full"
            options={[
              { label: "2400 DPI", value: 2400 },
              { label: "1800 DPI", value: 1800 },
              { label: "1200 DPI", value: 1200 },
              { label: "960 DPI", value: 960 },
              { label: "800 DPI", value: 800 },
              { label: "600 DPI", value: 600 },
              { label: "500 DPI", value: 500 },
              { label: "400 DPI", value: 400 },
              { label: "300 DPI", value: 300 },
              { label: "200 DPI", value: 200 },
              { label: "150 DPI", value: 150 },
              { label: "96 DPI", value: 96 },
              { label: "72 DPI", value: 72 },
            ]}
          />
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

