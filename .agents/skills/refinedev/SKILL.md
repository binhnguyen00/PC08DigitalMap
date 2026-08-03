---
name: refinedev
description: "Hướng dẫn lựa chọn và ứng dụng React hooks từ @refinedev/core và @refinedev/antd (useOne, useList, useSelect, useCreate, useUpdate, useDelete, useTable, useForm, useInvalidate, useGetIdentity) cho từng tình huống nghiệp vụ trong dự án React + Odoo 19."
---

# refinedev

Hướng dẫn agent lựa chọn và sử dụng Refine React Hooks đúng chuẩn theo từng tình huống nghiệp vụ thực tế.

---

## Danh Sách Hook & Tài Liệu Tham Chiếu Chi Tiết

| Hook | Tình Huống Sử Dụng Chính | File Tham Chiếu Props & Return |
|---|---|---|
| `useOne` | Đọc thông tin chi tiết của 1 bản ghi duy nhất theo ID | [use-one.md](file:///.agents/skills/refine-hooks/references/use-one.md) |
| `useList` | Lấy danh sách bản ghi có bộ lọc, sắp xếp, phân trang | [use-list.md](file:///.agents/skills/refine-hooks/references/use-list.md) |
| `useSelect` | Lấy mảng tùy chọn cho thẻ `<Select>` Ant Design | [use-select.md](file:///.agents/skills/refine-hooks/references/use-select.md) |
| `useCreate` | Thêm mới 1 bản ghi vào Odoo database | [use-create.md](file:///.agents/skills/refine-hooks/references/use-create.md) |
| `useUpdate` | Cập nhật thông tin bản ghi đã có theo ID | [use-update.md](file:///.agents/skills/refine-hooks/references/use-update.md) |
| `useDelete` | Xóa 1 bản ghi khỏi Odoo database | [use-delete.md](file:///.agents/skills/refine-hooks/references/use-delete.md) |
| `useTable` | Dựng Bảng dữ liệu Ant Design `<Table>` tự động phân trang/lọc | [use-table.md](file:///.agents/skills/refine-hooks/references/use-table.md) |
| `useForm` | Dựng Form Ant Design `<Form>` tạo mới / chỉnh sửa dữ liệu | [use-form.md](file:///.agents/skills/refine-hooks/references/use-form.md) |
| `useInvalidate` | Xóa cache buộc danh sách/chi tiết trên UI tải lại | [use-invalidate.md](file:///.agents/skills/refine-hooks/references/use-invalidate.md) |
| `useGetIdentity` | Lấy hồ sơ tài khoản người dùng đang đăng nhập | [use-get-identity.md](file:///.agents/skills/refine-hooks/references/use-get-identity.md) |

---

## Quyết Định Chọn Hook Theo Trường Hợp Nghiệp Vụ

### 1. Hiển Thị Trang Bảng Danh Sách Người Dùng / Tài Liệu (Antd Table)
- **Dùng Hook**: `useTable` (`@refinedev/antd`)
- **Lý do**: Tự động quản lý state phân trang, sắp xếp cột, bộ lọc và form tìm kiếm.
- **Xem chi tiết**: [use-table.md](file:///.agents/skills/refine-hooks/references/use-table.md)

### 2. Hiển Thị Danh Sách Thẻ (Cards / Grid / Sidebar Item)
- **Dùng Hook**: `useList` (`@refinedev/core`)
- **Lý do**: Cung cấp mảng `data` linh hoạt để render UI tùy biến (Card, Grid, Custom List).
- **Xem chi tiết**: [use-list.md](file:///.agents/skills/refine-hooks/references/use-list.md)

### 3. Modal Hoặc Trang Tạo Mới / Edit Bản Ghi Dùng Antd Form
- **Dùng Hook**: `useForm` (`@refinedev/antd`)
- **Lý do**: Tự động bind `formProps` và `saveButtonProps` với `<Form>` và `<Button>`, tự fetch dữ liệu cũ khi `action="edit"`.
- **Xem chi tiết**: [use-form.md](file:///.agents/skills/refine-hooks/references/use-form.md)

### 4. Nạp Danh Sách Dropdown Chọn Danh Mục / Thẻ / Phòng Ban
- **Dùng Hook**: `useSelect` (`@refinedev/core` hoặc `@refinedev/antd`)
- **Lý do**: Trả về `selectProps` truyền trực tiếp vào `<Select {...selectProps} />`.
- **Xem chi tiết**: [use-select.md](file:///.agents/skills/refine-hooks/references/use-select.md)

### 5. Nút Thao Tác Độc Lập (Click Nút Xóa, Nút Đổi Trạng Thái, Nút Tạo Nhanh)
- **Dùng Hook**: `useCreate`, `useUpdate`, `useDelete` (`@refinedev/core`)
- **Lý do**: Trả về hàm `mutate` kích hoạt nhanh mutation bằng event handler.
- **Xem chi tiết**: [use-create.md](file:///.agents/skills/refine-hooks/references/use-create.md) | [use-update.md](file:///.agents/skills/refine-hooks/references/use-update.md) | [use-delete.md](file:///.agents/skills/refine-hooks/references/use-delete.md)

### 6. Xem Chi Tiết 1 Bản Ghi (Detail Page / Drawer / Modal View)
- **Dùng Hook**: `useOne` (`@refinedev/core`)
- **Lý do**: Nạp 1 bản ghi duy nhất dựa theo `id`, tự động re-fetch khi `id` thay đổi.
- **Xem chi tiết**: [use-one.md](file:///.agents/skills/refine-hooks/references/use-one.md)

### 7. Tải Lại UI Sau Khi Thực Hiện Thao Tác Đặt Biệt
- **Dùng Hook**: `useInvalidate` (`@refinedev/core`)
- **Lý do**: Xóa cache TanStack Query để danh sách hoặc trang chi tiết tự động nạp lại dữ liệu mới nhất.
- **Xem chi tiết**: [use-invalidate.md](file:///.agents/skills/refine-hooks/references/use-invalidate.md)

---

## Quy Tắc Lập Trình Bắt Buộc Khi Viết Hook

1. **Meta Fields mandatory**: Mọi hook đọc dữ liệu (`useOne`, `useList`, `useSelect`, `useTable`, `useForm`) PHẢI khai báo `meta: { fields: [...] }`.
2. **Tắt Notification Mặc Định Khi Tự Dùng Custom Toast**: Khi tự gọi `message.success()` hoặc `message.error()` trong callback (`onSuccess`/`onError`), BẮT BUỘC tắt notification mặc định của Refine bằng cách truyền `successNotification: false, errorNotification: false`.
3. **Standard React Hook format**:
   - Built-in React hooks: `React.useState`, `React.useMemo`, `React.useEffect`.
   - Refine hooks: Import trực tiếp từ `@refinedev/core` hoặc `@refinedev/antd`.
4. **Giải bọc dữ liệu an toàn**: Truy cập dữ liệu qua `query?.data?.data` cho `useOne`, `useList`, `useTable`.