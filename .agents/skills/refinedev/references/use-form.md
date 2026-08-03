# useForm (`@refinedev/antd`)

Hook liên kết giữa **Ant Design `<Form>`** và **Refine DataProvider**, quản lý trạng thái khởi tạo, tải dữ liệu cũ (`action="edit"`), validation và tự động submit API (`useCreate` / `useUpdate`).

---

## Props / Options Tham Số

```typescript
useForm<TData>({
  // Bắt buộc
  resource: string,           // Tên model Odoo (vd: "mbf.document.category")
  action: "create" | "edit" | "clone", // Hành động của Biểu mẫu

  // Bắt buộc khi action="edit" hoặc "clone"
  id?: BaseKey,               // ID của bản ghi

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],        // Khai báo danh sách các trường cần fetch dữ liệu cũ khi edit
  },

  // Điều hướng sau khi lưu thành công
  redirect?: "show" | "edit" | "list" | false, // Mặc định "list" hoặc false nếu modal

  // Callbacks
  onMutationSuccess?: (data: any, variables: any, context: any) => void,
  onMutationError?: (error: any, variables: any, context: any) => void,

  // Tùy chọn khác
  warnWhenUnsavedChanges?: boolean, // Cảnh báo khi rời trang nếu chưa lưu
  autoSave?: {
    enabled?: boolean,
    debounce?: number,
  },
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  formProps: {
    form,          // Instance Antd Form
    onFinish,      // Callback tự động xử lý khi submit thành công validation
    initialValues, // Giá trị ban đầu nạp từ API (khi action="edit")
  },
  saveButtonProps: {
    onClick,       // Callback trigger validate & submit form
    loading,       // Cờ loading khi đang submit API
  },
  formLoading,     // Trạng thái đang tải dữ liệu bản ghi cũ về Form
  form,            // Antd Form Instance
  onFinish,        // Hàm submit form thủ công: onFinish(values)
  id,              // ID bản ghi hiện tại
  formQueryResult, // TanStack Query Result khi fetch dữ liệu edit
} = useForm<TData>({ ... });
```

---

## Code Mẫu Chuẩn

```tsx
import { useForm } from "@refinedev/antd";
import { Form, Input, Button, Modal } from "antd";

interface ICategoryFormModalProps {
  open: boolean;
  editId?: number;
  onClose: () => void;
}

export const CategoryFormModal = ({ open, editId, onClose }: ICategoryFormModalProps) => {
  const { formProps, saveButtonProps, formLoading } = useForm({
    resource: "mbf.document.category",
    action: editId ? "edit" : "create",
    id: editId,
    meta: {
      fields: ["id", "name", "description"],
    },
    onMutationSuccess: () => {
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      title={editId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy</Button>,
        <Button key="save" {...saveButtonProps} type="primary">Lưu danh mục</Button>,
      ]}
    >
      <Form {...formProps} layout="vertical" disabled={formLoading}>
        <Form.Item
          name="name"
          label="Tên danh mục"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
        >
          <Input placeholder="Nhập tên danh mục..." />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```
