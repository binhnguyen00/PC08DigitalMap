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

export interface IBenBaiProperties {
  id: number;
  stt: number;
  name: string;
  phone: string;
  owner: string;
  ownerPhone: string;
  location: string;
  rawType: string;
  category: string;
  materialsSand: string;
  materialsMineral: string;
  materialsOther: string;
  permitNumber: string;
  permitStatus: "Có phép" | "Không phép" | "Hết phép" | "Không xác định";
  permitExpiry: string;
  officerName: string;
  officerPhone: string;
  commanderName: string;
  commanderPhone: string;
  leaderName: string;
  leaderPhone: string;
  originalLink: string;
  operatingStatus: "Đang hoạt động" | "Dừng hoạt động" | "Không xác định";
  managementUnit: string;
  managementTeam: "Bạch Đằng" | "ĐT1" | "ĐT2" | "Chưa gán đơn vị";
  coordinatesStr: string;
}

export interface IBenBaiFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: IBenBaiProperties;
}
