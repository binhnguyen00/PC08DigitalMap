export interface IAreaItem {
  id: string;
  name: string;
  filename: string;
  cdnUrl: string;
  type: "Area" | "DiaBan";
  featureCount?: number;
  geometryType?: string;
  rawJson?: any;
}

export type IDiaBanItem = IAreaItem;

export interface IRouteItem {
  id: string;
  name: string;
  filename: string;
  cdnUrl: string;
  type: "Route" | "TuyenDuong";
  featureCount?: number;
  geometryType?: string;
  rawJson?: any;
}

export type ITuyenDuongItem = IRouteItem;

export interface IGeoJsonFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}
