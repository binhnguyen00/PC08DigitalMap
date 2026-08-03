# useUpdate (`@refinedev/core`)

Hook thực hiện Mutation **cập nhật bản ghi có sẵn** trong Odoo (gọi `dataProvider.update` -> `odoo.write` + `odoo.read`).

---

## Props / Options Tham Số

```typescript
useUpdate<TData, TVariables>({
  // Tùy chọn ở hook level (có thể truyền tại mutate)
  resource?: string,          // Tên model Odoo
  id?: BaseKey,               // ID bản ghi

  // Quản lý Invalidation
  invalidates?: Array<"list" | "many" | "detail" | "all" | "resource">, // Mặc định: ["list", "many", "detail"]

  // Tắt thông báo mặc định khi tự dùng message.success/error của Antd
  successNotification?: SuccessNotificationConfig | false,
  errorNotification?: ErrorNotificationConfig | false,

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],
  },

  // TanStack Mutation Options
  mutationOptions?: {
    onSuccess?: (data: UpdateResponse<TData>, variables: { resource: string; id: BaseKey; values: TVariables }) => void,
    onError?: (error: HttpError) => void,
  },

  dataProviderName?: string,
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  mutate,         // Hàm kích hoạt callback: mutate({ resource, id, values })
  mutateAsync,    // Hàm kích hoạt dạng Promise: await mutateAsync({ resource, id, values })
  mutation,       // Đối tượng TanStack Mutation (isLoading, isSuccess, isError, error)
} = useUpdate<TData, TVariables>();
```

---

## Code Mẫu Chuẩn

```tsx
import { useUpdate } from "@refinedev/core";
import { Button, message } from "antd";

interface IUpdateDocVariables {
  name: string;
  active: boolean;
}

export const UpdateDocumentButton = ({ docId }: { docId: number }) => {
  const { mutate, mutation } = useUpdate<IDocumentRecord, IUpdateDocVariables>();

  const handleUpdate = () => {
    mutate(
      {
        resource: "mbf.document",
        id: docId,
        values: {
          name: "Văn bản đã chỉnh sửa",
          active: true,
        },
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          message.success("Cập nhật thành công!");
        },
        onError: (err) => {
          message.error(`Lỗi cập nhật: ${err.message}`);
        },
      }
    );
  };

  return (
    <Button
      loading={mutation.isLoading}
      onClick={handleUpdate}
    >
      Lưu thay đổi
    </Button>
  );
};
```
