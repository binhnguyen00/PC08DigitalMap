# useTable (`@refinedev/antd`)

Hook liên kết tự động giữa **Ant Design `<Table>`** và **Refine DataProvider** (`useList`), hỗ trợ tự động quản lý phân trang, sắp xếp, lọc và tìm kiếm.

---

## Props / Options Tham Số

```typescript
useTable<TData>({
  // Bắt buộc
  resource: string,           // Tên model Odoo (vd: "res.users")

  // Bộ lọc & Sắp xếp ban đầu
  initialSorter?: CrudSorters,// Mảng [{ field, order }]
  initialFilter?: CrudFilters,// Mảng [{ field, operator, value }]
  initialCurrent?: number,    // Trang ban đầu (mặc định: 1)
  initialPageSize?: number,   // Kích thước trang ban đầu (mặc định: 10)

  // Cấu hình lọc nâng cao
  filters?: {
    initial?: CrudFilters,
    permanent?: CrudFilters, // Bộ lọc cố định không bị thay đổi bởi UI
    defaultBehavior?: "merge" | "replace",
  },
  sorters?: {
    initial?: CrudSorters,
    permanent?: CrudSorters,
  },

  // Đồng bộ với đường dẫn URL
  syncWithLocation?: boolean, // Lưu filters/pagination vào URL query params (mặc định: false)

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],        // Phải khai báo đủ các cột sẽ hiển thị trên Bảng
    domain?: any[],           // Odoo domain gốc
  },

  // Xử lý Form Tìm Kiếm
  onSearch?: (values: any) => CrudFilters | Promise<CrudFilters>,

  // TanStack Query Options
  queryOptions?: {
    enabled?: boolean,
    keepPreviousData?: boolean,
  },
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  tableProps: {
    dataSource,    // Nguồn dữ liệu mảng TData[] truyền thẳng vào <Table />
    loading,       // Cờ loading
    pagination,    // Props phân trang Antd { current, pageSize, total, onChange }
    onChange,      // Callback khi click đổi trang/sắp xếp trên Bảng
  },
  searchFormProps, // Props nạp thẳng vào Antd <Form {...searchFormProps} />
  setFilters,      // (filters: CrudFilters, behavior?: "merge" | "replace") => void
  setSorters,      // (sorters: CrudSorters) => void
  current,         // Trang hiện tại
  pageSize,        // Kích thước trang
  pageCount,       // Tổng số trang
  tableQuery,      // TanStack Query Result từ useList bên dưới
} = useTable<TData>({ ... });
```

---

## Code Mẫu Chuẩn

```tsx
import { useTable } from "@refinedev/antd";
import { Table, Input, Form } from "antd";

interface IUserRecord {
  id: number;
  name: string;
  login: string;
  email: string;
}

export const UserListView = () => {
  const { tableProps, searchFormProps } = useTable<IUserRecord>({
    resource: "res.users",
    initialSorter: [{ field: "id", order: "desc" }],
    meta: {
      fields: ["id", "name", "login", "email"],
    },
    onSearch: (values) => [
      {
        field: "name,login,email",
        operator: "custom_search",
        value: values.search,
      },
    ],
  });

  return (
    <div className="space-y-4">
      <Form {...searchFormProps} layout="inline">
        <Form.Item name="search">
          <Input.Search placeholder="Tìm kiếm người dùng..." enterButton />
        </Form.Item>
      </Form>

      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={80} />
        <Table.Column dataIndex="name" title="Họ và tên" />
        <Table.Column dataIndex="login" title="Tên đăng nhập" />
        <Table.Column dataIndex="email" title="Email" />
      </Table>
    </div>
  );
};
```
