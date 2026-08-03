# useList (`@refinedev/core`)

Hook lấy **danh sách bản ghi** từ Odoo có hỗ trợ Lọc, Sắp xếp và Phân trang (gọi `dataProvider.getList` -> `odoo.searchRead` + `odoo.searchCount`).

---

## Props / Options Tham Số

```typescript
useList<TData>({
  // Bắt buộc
  resource: string,           // Tên model Odoo (vd: "mbf.document")

  // Bộ lọc dữ liệu
  filters?: CrudFilters,      // Mảng [{ field, operator, value }]

  // Sắp xếp dữ liệu
  sorters?: CrudSorters,      // Mảng [{ field, order: "asc" | "desc" }]

  // Cấu hình phân trang
  pagination?: {
    current?: number,         // Trang hiện tại (1-indexed, mặc định 1)
    pageSize?: number,        // Số bản ghi mỗi trang (mặc định 25)
    mode?: "server" | "client" | "off", // "off" để lấy toàn bộ không phân trang
  },

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],        // Danh sách trường Odoo cần lấy
    domain?: any[],           // Odoo domain gốc bổ sung (vd: [["state", "=", "approved"]])
  },

  // TanStack Query Options
  queryOptions?: {
    enabled?: boolean,
    staleTime?: number,
    cacheTime?: number,
    keepPreviousData?: boolean,
    onSuccess?: (data: GetListResponse<TData>) => void,
    onError?: (error: HttpError) => void,
  },

  // Tùy chọn khác
  dataProviderName?: string,
  hasPagination?: boolean,
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  data,          // Shortcut tới query.data ({ data: TData[], total: number })
  isLoading,     // Trạng thái đang nạp dữ liệu
  isFetching,    // Trạng thái đang refetch ngầm
  isError,       // Cờ báo lỗi
  error,         // Đối tượng lỗi
  refetch,       // Tải lại danh sách
  query,         // Đối tượng TanStack Query gốc
} = useList<TData>({ ... });
```

---

## Code Mẫu Chuẩn

```tsx
import { useList } from "@refinedev/core";

interface IDocument {
  id: number;
  name: string;
  create_date: string;
}

export const DocumentList = ({ activeCategoryId }: { activeCategoryId?: number }) => {
  const { query } = useList<IDocument>({
    resource: "mbf.document",
    filters: activeCategoryId
      ? [{ field: "category_id", operator: "eq", value: activeCategoryId }]
      : [],
    sorters: [{ field: "create_date", order: "desc" }],
    pagination: { current: 1, pageSize: 20 },
    meta: {
      fields: ["id", "name", "create_date"],
      domain: [["active", "=", true]],
    },
    queryOptions: {
      keepPreviousData: true,
    },
  });

  const documents = query?.data?.data ?? [];
  const total = query?.data?.total ?? 0;

  if (query.isLoading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Tổng bản ghi: {total}</h3>
      {documents.map((doc) => (
        <div key={doc.id}>{doc.name}</div>
      ))}
    </div>
  );
};
```
