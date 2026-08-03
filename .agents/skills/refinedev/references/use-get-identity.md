# useGetIdentity (`@refinedev/core`)

Hook lấy thông tin hồ sơ (profile/identity) của người dùng đang đăng nhập hệ thống từ `authProvider.getIdentity`.

---

## Props / Options Tham Số

```typescript
useGetIdentity<TIdentity>({
  v3LegacyAuthProviderCompat?: boolean,
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
  data,          // Thông tin người dùng (TIdentity)
  isLoading,     // Trạng thái đang xác thực/tải thông tin
  isError,       // Cờ lỗi
  refetch,       // Tải lại thông tin người dùng
} = useGetIdentity<IUserIdentity>();
```

---

## Code Mẫu Chuẩn

```tsx
import { useGetIdentity } from "@refinedev/core";
import { Avatar } from "antd";

interface IUserIdentity {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export const UserProfileHeader = () => {
  const { data: user, isLoading } = useGetIdentity<IUserIdentity>();

  if (isLoading) return <div>Đang nạp hồ sơ...</div>;
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Avatar src={user.avatar}>{user.name?.[0]}</Avatar>
      <span className="font-medium">{user.name}</span>
    </div>
  );
};
```
