# useCreate (`@refinedev/core`)

Hook thực hiện Mutation **tạo bản ghi mới** trong Odoo (gọi `dataProvider.create` -> `odoo.create` + `odoo.read`).

---

## Props / Options Tham Số

```typescript
useCreate<TData, TVariables>({
  // Tùy chọn ở hook level (có thể ghi đè khi gọi hàm mutate)
  resource?: string,          // Tên model Odoo

  // Quản lý Invalidation
  invalidates?: Array<"list" | "many" | "detail" | "all" | "resource">, // Mặc định: ["list", "many"]

  // Tắt thông báo mặc định khi tự dùng message.success/error của Antd
  successNotification?: SuccessNotificationConfig | false,
  errorNotification?: ErrorNotificationConfig | false,

  // Cấu hình Odoo DataProvider
  meta?: {
    fields?: string[],
  },

  // TanStack Mutation Options
  mutationOptions?: {
    onSuccess?: (data: CreateResponse<TData>, variables: { resource: string; values: TVariables }) => void,
    onError?: (error: HttpError, variables: { resource: string; values: TVariables }) => void,
    onSettled?: () => void,
  },

  dataProviderName?: string,
})
```

---

## Dữ Liệu Trả Về (Return Values)

```typescript
const {
  mutate,         // Hàm kích hoạt mutation dạng callback: mutate({ resource, values })
  mutateAsync,    // Hàm kích hoạt dạng Promise: await mutateAsync({ resource, values })
  mutation,       // Đối tượng TanStack Mutation (isLoading, isSuccess, isError, error, data)
} = useCreate<TData, TVariables>();
```

---

## Tham Số Hàm `mutate`

```typescript
mutate({
  resource: "mbf.document",            // Tên Odoo model
  values: {                            // Dữ liệu tạo mới
    name: "Tài liệu mới",
    category_id: 1,
  },
  successNotification: false,          // Tắt notification tự động khi đã dùng message.success ở onSuccess
  errorNotification: false,            // Tắt error notification tự động khi đã dùng message.error ở onError
  meta: { fields: ["id", "name"] },    // meta ghi đè nếu cần
}, {
  onSuccess: (response) => { ... },    // Callback thành công riêng cho lượt gọi này
  onError: (error) => { ... },
});
```

---

## Code Mẫu Chuẩn

```tsx
import { useCreate } from "@refinedev/core";
import { Button, message } from "antd";

interface ICreateDocVariables {
  name: string;
  category_id: number;
}

export const CreateDocumentButton = () => {
  const { mutate, mutation } = useCreate<IDocumentRecord, ICreateDocVariables>();

  const handleCreate = () => {
    mutate(
      {
        resource: "mbf.document",
        values: {
          name: "Văn bản mới",
          category_id: 2,
        },
        successNotification: false,
        errorNotification: false,
      },
      {
        onSuccess: () => {
          message.success("Tạo văn bản thành công!");
        },
        onError: (err) => {
          message.error(`Lỗi: ${err.message}`);
        },
      }
    );
  };

  return (
    <Button
      type="primary"
      loading={mutation.isLoading}
      onClick={handleCreate}
    >
      Tạo mới văn bản
    </Button>
  );
};
```
