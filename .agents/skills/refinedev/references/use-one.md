# useOne (`@refinedev/core`)

Hook lấy **1 bản ghi duy nhất** từ Odoo theo `id` (gọi `dataProvider.getOne` -> `odoo.read`).

---

## Props / Options Tham Số

```typescript
useOne<TData>({
  // Bắt buộc
  resource: string,           // Tên model Odoo (vd: "mbf.document", "res.users")
  id: string | number,        // ID của bản ghi cần lấy

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],        // Các trường Odoo cần đọc (vd: ["id", "name", "category_id"])
    domain?: any[],           // Odoo domain bổ sung nếu cần
  },

  // TanStack Query Options
  queryOptions?: {
    enabled?: boolean,        // Chỉ fetch khi điều kiện true (vd: !!id)
    staleTime?: number,       // Thời gian cache giữ tươi (ms)
    cacheTime?: number,       // Thời gian lưu cache trong bộ nhớ (ms)
    retry?: boolean | number, // Số lần thử lại nếu thất bại
    onSuccess?: (data: GetOneResponse<TData>) => void,
    onError?: (error: HttpError) => void,
  },

  // Tùy chọn nâng cao
  dataProviderName?: string,  // Tên provider (nếu dùng đa dataProvider)
  liveMode?: "auto" | "manual" | "off",
  onLiveEvent?: (event: LiveEvent) => void,
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  data,          // Shortcut tới query.data ({ data: TData })
  isLoading,     // Trạng thái đang tải dữ liệu
  isFetching,    // Trạng thái đang cập nhật ngầm
  isError,       // Cờ báo lỗi
  error,         // Đối tượng lỗi
  refetch,       // Hàm tải lại dữ liệu thủ công
  query,         // Đối tượng TanStack Query gốc
} = useOne<TData>({ ... });
```

---

## Code Mẫu Chuẩn

```tsx
import { useOne } from "@refinedev/core";

interface IDocument {
  id: number;
  name: string;
  category_id: [number, string];
}

export const DocumentDetail = ({ docId }: { docId: number }) => {
  const { query } = useOne<IDocument>({
    resource: "mbf.document",
    id: docId,
    meta: {
      fields: ["id", "name", "category_id"],
    },
    queryOptions: {
      enabled: !!docId,
    },
  });

  const doc = query?.data?.data;

  if (query.isLoading) return <div>Đang tải...</div>;
  if (query.isError) return <div>Lỗi khi tải dữ liệu</div>;
  if (!doc) return <div>Không tìm thấy bản ghi</div>;

  return (
    <div>
      <h2>{doc.name}</h2>
      <p>Danh mục: {doc.category_id?.[1]}</p>
    </div>
  );
};
```
