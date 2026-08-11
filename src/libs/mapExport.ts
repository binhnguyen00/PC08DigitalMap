import {
  DPI,
  type DPIType,
  Format,
  type FormatType,
  MapGenerator,
  MaplibreExportControl,
  PageOrientation,
  type PageOrientationType,
  Size,
  type SizeType,
} from "@watergis/maplibre-gl-export";
import type { Map as MaplibreMap } from "maplibre-gl";

export { DPI, Format, MapGenerator, MaplibreExportControl, PageOrientation, Size };
export type { DPIType, FormatType, PageOrientationType, SizeType };

export interface IExportMapOptions {
  fileName?: string;
  format?: FormatType;
  size?: SizeType;
  unit?: "in" | "mm";
  dpi?: DPIType;
  widthPx?: number;
  heightPx?: number;
}

export async function exportMapImage(
  mapInstance: MaplibreMap,
  exportOptions?: IExportMapOptions,
): Promise<void> {
  if (!mapInstance) {
    throw new Error("Map instance is required for exporting map.");
  }

  const targetDpi = exportOptions?.dpi ?? DPI[300];
  let exportSize: SizeType = exportOptions?.size ?? Size.A4;
  let exportUnit: "in" | "mm" = exportOptions?.unit ?? "mm";

  if (exportOptions?.widthPx && exportOptions?.heightPx) {
    const widthInches = exportOptions.widthPx / targetDpi;
    const heightInches = exportOptions.heightPx / targetDpi;
    exportSize = [widthInches, heightInches];
    exportUnit = "in";
  }

  const generator = new MapGenerator(mapInstance, {
    fileName: exportOptions?.fileName ?? "bando_pc08",
    format: exportOptions?.format ?? Format.PNG,
    size: exportSize,
    unit: exportUnit,
    dpi: targetDpi,
    download: true,
  });

  await generator.generate();
}

export async function exportMap4K(
  mapInstance: MaplibreMap,
  fileName = "bando_pc08_4K",
  widthPx = 3840,
  heightPx = 2160,
): Promise<void> {
  await exportMapImage(mapInstance, {
    fileName,
    format: Format.PNG,
    dpi: DPI[300],
    widthPx,
    heightPx,
  });
}
