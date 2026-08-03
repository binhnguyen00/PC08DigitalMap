# useInvalidate (`@refinedev/core`)

Hook xóa/làm tươi cache dữ liệu của TanStack Query cho các tài nguyên (resource), giúp UI tự động nạp lại dữ liệu mới nhất sau khi thực hiện các tác vụ cập nhật.

---

## Tham Số Hàm `invalidate`

```typescript
const invalidate = useInvalidate();

invalidate({
  // Bắt buộc
  resource?: string,          // Tên model Odoo (vd: "mbf.document")

  // Danh mục Cache cần Invalidate (Bắt buộc)
  invalidates: Array<"all" | "resource" | "list" | "many" | "detail">,
  // - "all": Xóa toàn bộ cache ứng dụng
  // - "resource": Xóa toàn bộ cache của resource này
  // - "list": Xóa cache các danh sách useList / useTable
  // - "many": Xóa cache useMany
  // - "detail": Xóa cache useOne / useShow theo ID

  // Nếu xóa cache theo ID cụ thể
  id?: BaseKey,

  // Provider
  dataProviderName?: string,
});
```

---

## Code Mẫu Chuẩn

```tsx
import { useInvalidate } from "@refinedev/core";
import { Button } from "antd";

export const RefreshButton = ({ docId }: { docId?: number }) => {
  const invalidate = useInvalidate();

  const handleRefreshList = () => {
    // Làm tươi danh sách tài liệu
    invalidate({
      resource: "mbf.document",
      invalidates: ["list"],
    });
  };

  const handleRefreshDetail = () => {
    if (!docId) return;
    // Làm tươi chi tiết 1 bản ghi
    invalidate({
      resource: "mbf.document",
      invalidates: ["detail"],
      id: docId,
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleRefreshList}>Làm mới Danh Sách</Button>
      {docId && <Button onClick={handleRefreshDetail}>Làm mới Chi Tiết</Button>}
    </div>
  );
};
```
