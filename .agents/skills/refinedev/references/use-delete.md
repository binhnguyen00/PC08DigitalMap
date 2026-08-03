# useDelete (`@refinedev/core`)

Hook thực hiện Mutation **xóa bản ghi** trong Odoo (gọi `dataProvider.deleteOne` -> `odoo.unlink`).

---

## Props / Options Tham Số

```typescript
useDelete<TData, TVariables>({
  // Tùy chọn ở hook level (có thể truyền tại mutate)
  resource?: string,          // Tên model Odoo
  id?: BaseKey,               // ID bản ghi

  // Quản lý Invalidation
  invalidates?: Array<"list" | "many" | "detail" | "all" | "resource">, // Mặc định: ["list", "many"]

  // Tắt thông báo mặc định khi tự dùng message.success/error của Antd
  successNotification?: SuccessNotificationConfig | false,
  errorNotification?: ErrorNotificationConfig | false,

  // TanStack Mutation Options
  mutationOptions?: {
    onSuccess?: (data: DeleteOneResponse<TData>, variables: { resource: string; id: BaseKey }) => void,
    onError?: (error: HttpError) => void,
  },

  dataProviderName?: string,
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  mutate,         // Hàm kích hoạt callback: mutate({ resource, id })
  mutateAsync,    // Hàm kích hoạt dạng Promise: await mutateAsync({ resource, id })
  mutation,       // Đối tượng TanStack Mutation (isLoading, isSuccess, isError)
} = useDelete<TData>();
```

---

## Code Mẫu Chuẩn

```tsx
import { useDelete } from "@refinedev/core";
import { Button, Popconfirm, message } from "antd";

export const DeleteDocumentButton = ({ docId }: { docId: number }) => {
  const { mutate, mutation } = useDelete();

  const handleDelete = () => {
    mutate(
      {
        resource: "mbf.document",
        id: docId,
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          message.success("Đã xóa văn bản!");
        },
        onError: (err) => {
          message.error(`Không thể xóa: ${err.message}`);
        },
      }
    );
  };

  return (
    <Popconfirm
      title="Xác nhận xóa văn bản này?"
      onConfirm={handleDelete}
      okText="Xóa"
      cancelText="Hủy"
    >
      <Button danger loading={mutation.isLoading}>
        Xóa
      </Button>
    </Popconfirm>
  );
};
```
