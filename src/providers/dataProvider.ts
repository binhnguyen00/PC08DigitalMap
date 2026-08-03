import {
  BaseRecord,
  DataProvider,
  GetListParams,
  GetListResponse,
  GetManyParams,
  GetManyResponse,
  GetOneParams,
  GetOneResponse,
} from "@refinedev/core";

import { CDN_BASE_URL, fetchGeoJson, getAreaList, getRouteList } from "@/libs/cdn";

export const dataProvider: DataProvider = {
  getApiUrl: () => CDN_BASE_URL,

  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams
  ): Promise<GetListResponse<TData>> => {
    const { resource, filters } = params;

    let items: any[] = [];
    if (resource === "areas" || resource === "diaban") {
      items = getAreaList();
    } else if (resource === "routes" || resource === "tuyenduong") {
      items = getRouteList();
    }

    if (filters && filters.length > 0) {
      for (const filter of filters) {
        if ("field" in filter && filter.field === "name" && filter.value) {
          const searchVal = String(filter.value).toLowerCase();
          items = items.filter((item) => item.name.toLowerCase().includes(searchVal));
        }
      }
    }

    return {
      data: items as any[],
      total: items.length,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams
  ): Promise<GetOneResponse<TData>> => {
    const { id, resource } = params;
    const itemName = String(id);

    const folder = resource === "areas" || resource === "diaban" ? "DiaBan" : "TuyenDuong";
    const rawJson = await fetchGeoJson(folder, itemName);

    const featureCount = rawJson?.features?.length || 0;
    const geometryType = rawJson?.features?.[0]?.geometry?.type || "Unknown";

    const record: any = {
      id: itemName,
      name: itemName,
      filename: `${itemName}.geojson`,
      cdnUrl: `${CDN_BASE_URL}/${folder}/${itemName}.geojson`,
      type: folder === "DiaBan" ? "Area" : "Route",
      featureCount,
      geometryType,
      rawJson,
    };

    return {
      data: record as TData,
    };
  },

  getMany: async <TData extends BaseRecord = BaseRecord>(
    params: GetManyParams
  ): Promise<GetManyResponse<TData>> => {
    const { ids, resource } = params;
    const results = await Promise.all(
      ids.map((id) =>
        dataProvider.getOne<TData>({ resource, id })
      )
    );
    return {
      data: results.map((res) => res.data),
    };
  },

  create: async () => {
    throw new Error("Create not supported in read-only CDN data provider");
  },

  update: async () => {
    throw new Error("Update not supported in read-only CDN data provider");
  },

  deleteOne: async () => {
    throw new Error("Delete not supported in read-only CDN data provider");
  },
};
