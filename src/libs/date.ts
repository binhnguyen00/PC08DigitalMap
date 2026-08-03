import { format } from "date-fns";

export function formatDate(date: Date | string | number, formatStr: string = "dd/MM/yyyy HH:mm"): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return format(parsedDate, formatStr);
}
