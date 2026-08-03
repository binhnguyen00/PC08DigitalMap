# useSelect (`@refinedev/core` / `@refinedev/antd`)

Hook lấy danh sách tùy chọn và tự động format thành `selectProps` dùng trực tiếp cho component `<Select>` của Ant Design.

---

## Props / Options Tham Số

```typescript
useSelect<TData>({
  // Bắt buộc
  resource: string,           // Tên model Odoo (vd: "mbf.document.category")

  // Định nghĩa Label & Value
  optionLabel?: string | ((item: TData) => string), // Tên trường làm Label (mặc định: "name")
  optionValue?: string | ((item: TData) => any),    // Tên trường làm Value (mặc định: "id")

  // Bộ lọc & Sắp xếp
  filters?: CrudFilters,
  sorters?: CrudSorters,

  // Phân trang
  pagination?: {
    current?: number,
    pageSize?: number,
    mode?: "server" | "client" | "off",
  },

  // Giá trị mặc định cần nạp trước khi render
  defaultValue?: BaseKey | BaseKey[],

  // Hoãn thời gian tìm kiếm (Search Debounce)
  debounce?: number,          // ms hoãn khi gõ tìm kiếm (mặc định: 300)
  onSearch?: (value: string) => CrudFilters, // Hàm tùy biến bộ lọc khi search

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],        // Phải chứa ít nhất optionLabel và optionValue
    domain?: any[],
  },

  // TanStack Query Options
  queryOptions?: {
    enabled?: boolean,
    staleTime?: number,
  },
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  selectProps: {
    options,       // Mảng các tùy chọn { label: string, value: any }
    loading,       // Trạng thái đang tải dữ liệu
    onSearch,      // Callback tìm kiếm tự động
    onClear,       // Callback khi xóa giá trị
  },
  query,           // Đối tượng TanStack Query gốc
} = useSelect<TData>({ ... });
```

---

## Code Mẫu Chuẩn

```tsx
import { useSelect } from "@refinedev/core";
import { Select } from "antd";

export const CategorySelect = ({ value, onChange }: { value?: number; onChange?: (val: number) => void }) => {
  const { selectProps } = useSelect({
    resource: "mbf.document.category",
    optionLabel: "name",
    optionValue: "id",
    meta: {
      fields: ["id", "name"],
    },
  });

  return (
    <Select
      {...selectProps}
      value={value}
      onChange={onChange}
      placeholder="Chọn danh mục"
      allowClear
      className="w-full"
    />
  );
};
```
