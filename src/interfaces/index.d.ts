export interface IDiaBanItem {
  id: string;
  name: string;
  filename: string;
  cdnUrl: string;
  type: "DiaBan";
  featureCount?: number;
  geometryType?: string;
  rawJson?: any;
}

export interface ITuyenDuongItem {
  id: string;
  name: string;
  filename: string;
  cdnUrl: string;
  type: "TuyenDuong";
  featureCount?: number;
  geometryType?: string;
  rawJson?: any;
}

export interface IGeoJsonFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}
