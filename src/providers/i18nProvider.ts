import { I18nProvider } from "@refinedev/core";

const translations: Record<string, string> = {
  "actions.create": "Tạo mới",
  "actions.edit": "Sửa",
  "actions.show": "Xem",
  "actions.delete": "Xóa",
  "actions.refresh": "Làm mới",

  "buttons.create": "Tạo mới",
  "buttons.edit": "Sửa",
  "buttons.show": "Xem chi tiết",
  "buttons.delete": "Xóa",

  "table.actions": "Hành động",

  "diaban.titles.list": "Danh sách địa bàn",
  "diaban.titles.show": "Chi tiết địa bàn",

  "tuyenduong.titles.list": "Danh sách tuyến đường",
  "tuyenduong.titles.show": "Chi tiết tuyến đường",

  "pages.error.404": "Trang không tồn tại",
  "pages.error.backHome": "Về trang chủ",
};

export const i18nProvider: I18nProvider = {
  translate: (key: string, options?: any, defaultMessage?: string) => {
    let message = translations[key] || defaultMessage || key;
    if (options && typeof options === "object") {
      Object.entries(options).forEach(([k, v]) => {
        message = message.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
      });
    }
    return message;
  },
  changeLocale: async () => {},
  getLocale: () => "vi",
};
