# 0. Bắt buộc — Skills

> **MANDATORY**: Trước khi thực hiện BẤT KỲ tác vụ nào, agent PHẢI đọc và áp dụng đồng thời cả hai skill sau:

| # | Skill | Path | Mục đích |
|---|---|---|---|
| 1 | `i-have-adhd` | [SKILL.md](.agents/skills/i-have-adhd/SKILL.md) | Cấu trúc output, focus, tránh lan man |
| 2 | `caveman` | [SKILL.md](.agents/skills/caveman/SKILL.md) | Nén token, trả lời súc tích |

**Quy trình bắt buộc:**
1. Đọc `.agents/skills/i-have-adhd/SKILL.md` bằng `view_file`.
2. Đọc `.agents/skills/caveman/SKILL.md` bằng `view_file`.
3. Áp dụng cả hai trong suốt phiên làm việc.

Không được bỏ qua bước này dù yêu cầu đơn giản.

---

# 1. Vai Trò

- Vai trò: Business Analyst + Senior Developer.
- Nếu yêu cầu thiếu ngữ cảnh: hỏi lại trước khi làm.
- Nếu không chắc thông tin: trả lời "Không biết".

# 2. Quy tắc Lập trình

| Quy tắc | Yêu cầu |
|---|---|
| Độ rõ ràng | Code đơn giản, dễ đọc, không "thông minh hóa" |
| Comment | Hạn chế tối đa |
| Tên biến | Viết đầy đủ, không viết tắt (`document`, không `doc`) |
| Thụt lề | Tab = 2 spaces |
| Cấu trúc | Flat logic¸ — không tách hàm con dùng 1 lần |
| Trình quản lý gói | pnpm |
| File env | Không đọc file `Dockerfile`, `docker-compose`, `.env` — trừ khi được yêu cầu rõ ràng |

# 3. Frontend (React)

**Cấu trúc thư mục client/src chuẩn:**
```text
client/src/
├── assets/         # Tài nguyên tĩnh (hình ảnh, logo, icons)
├── components/     # Component UI dùng chung (Header, Layout, UI elements)
├── interfaces/     # TypeScript definitions & Types cho dữ liệu
├── libs/           # Utility functions & API clients (odoo.ts, tailwind.ts)
├── pages/          # Trang màn hình Refine/React (DocumentList, CategoryPage)
├── providers/      # Refine custom providers (authProvider, dataProvider)
├── App.tsx         # Root component & Cấu hình Routes, Refine options
├── main.tsx        # Entry point ứng dụng
└── index.css       # Global styles (Tailwind CSS v4 imports)
```

**Bắt buộc:**
- Mọi gọi API tới Odoo → qua `client/src/libs/odoo.ts` duy nhất (proxy `/web` và `/mbf` đã cấu hình trong `vite.config.ts`). Không dùng Odoo views.
- Chỉ Tailwind CSS, không vanilla CSS. Important modifier: `class!` (vd: `text-red-500!`).
- Ưu tiên component Ant Design có sẵn.
- Import nội bộ dùng alias `@/` (vd: `@/providers/authProvider`).
- Thiết kế: phẳng, hiện đại, pastel, tối giản. Không giấu thông tin quan trọng trong modal/popup.
- Điều kiện className → dùng `cn()` từ `@/libs/tailwind.ts`, không dùng template string.
- Hook React: Luôn dùng `React.use<Hook>` (vd: `React.useState`) thay cho import và dùng `use<Hook>` trực tiếp.

**Format JSX:**
- Props ít (≤2-3, ngắn) → viết 1 dòng.
- Props nhiều hoặc dài → mỗi prop 1 dòng.

```jsx
// Đúng — ít props, ngắn
<Button type="text" danger icon={<DeleteOutlined />} />

// Đúng — nhiều props
<Input
  value={searchVal}
  placeholder="Tìm danh mục..."
  onChange={(e) => setSearchVal(e.target.value)}
/>
```

```jsx
// Đúng
<div className={cn("text-red-500", isTrue ? "font-bold" : "font-normal")}>
  Hello
</div>

// Sai — template string
<div className={`text-red-500 ${isTrue ? "font-bold" : "font-normal"}`}>
```

**Thư viện đã cài sẵn — KHÔNG cài lại, KHÔNG scan lại:**
- Dependencies: `@ant-design/icons`, `@ant-design/x`, `@emotion/react`, `@fontsource-variable/geist`, `@refinedev/antd`, `@refinedev/cli`, `@refinedev/core`, `@refinedev/react-router`, `@refinedev/react-table`, `@refinedev/simple-rest`, `@tabler/icons-react`, `@tanstack/react-table`, `@uiw/react-md-editor`, `antd`, `class-variance-authority`, `date-fns`, `dayjs`, `mammoth`, `radix-ui`, `react`, `react-dom`, `react-router`, `recharts`, `shadcn`, `tailwind-merge`, `tailwindcss`, `tw-animate-css`, `xlsx`, `zustand`
- DevDependencies: `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `autoprefixer`, `clsx`, `postcss`, `typescript`, `vite`, `vitest`

# 4. Backend (Odoo 19)

**Cấu trúc & Môi trường:**
- Các module Odoo hiện có: `core`, `mbf_assistant`, `mbf_document`, `shells` (trong `server/modules/`).
- Cấu trúc module chuẩn:
  ```text
  server/modules/mbf_xxx/
  ├── __manifest__.py
  ├── __init__.py
  ├── models/
  │   ├── __init__.py
  │   └── mbf_xxx.py
  └── security/
      └── ir.model.access.csv
  ```
- Python packages đã cài sẵn (`server/requirements.txt`): `watchdog`, `openpyxl`, `google-genai`, `pillow`, `python-docx`.
- Biến môi trường: `ODOO_DB`, `GEMINI_API_KEY`, `POSTGRES_*` được định nghĩa trong `.env`.

**Quy tắc Coding:**
- Xử lý nghiệp vụ 100% qua ORM Odoo. Tái sử dụng logic có sẵn trước khi viết mới.
- Thao tác backend → dùng skill `odoo-19.0`.
- Naming: module mới `mbf_xxx`, model mới `mbf.xxx.xxx`.
- Security: `ir.model.access.csv` mặc định `1,1,1,1` cho mọi module mới.
- Field alignment: căn cột thẳng hàng theo `=`.

```python
from odoo import models, fields, api


class DocumentCategory(models.Model):
  _name = 'mbf.document.category'
  _description = 'Danh mục tài liệu'

  name            = fields.Char(string='Tên danh mục', required=True)
  description     = fields.Text(string='Mô tả')
  parent_id       = fields.Many2one(
                      'mbf.document.category',
                      string='Danh mục cha',
                      ondelete='cascade',
                      index=True,
                    )
  child_ids       = fields.One2many('mbf.document.category', 'parent_id', string='Danh mục con')
  parent_path     = fields.Char(index=True, unaccent=False)
  document_ids    = fields.Many2many('mbf.document', string='Tài liệu')
```

# 5. Kiểm tra Code

- Sau mỗi lần sinh/sửa code React → chạy `pnpm --prefix client exec tsc --noEmit`.
- Sau mỗi lần sinh/sửa code Python → chạy `python3 -m py_compile <file_path>`.