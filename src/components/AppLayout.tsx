import { Layout, theme } from "antd";
import { Link, useLocation } from "react-router";
import { cn } from "@/libs/tailwind";

const { Header, Content } = Layout;

export const AppLayout = ({ children }: React.PropsWithChildren) => {
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <Layout className="h-screen font-sans flex flex-col overflow-hidden bg-slate-950">
      <Header className="bg-black/60 text-white backdrop-blur-md border-b border-white/10 px-3 sm:px-6 flex items-center justify-between h-16 shrink-0 gap-2 sm:gap-4 z-10">
        <div className="flex items-center gap-3 sm:gap-6 h-full min-w-0">
          <div className="flex items-center gap-2 h-full shrink-0">
            <div className="flex flex-col justify-center leading-tight shrink-0">
              <span className="font-bold text-base text-red-500 whitespace-nowrap">PC08 GIS</span>
            </div>
          </div>

          <div className="flex h-full items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/overview"
              title="Bản đồ"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-all font-semibold",
                location.pathname === "/overview" || location.pathname === "/"
                  ? "bg-white/15 text-white! border border-white/10"
                  : "text-slate-300 hover:text-white! hover:bg-white/5"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Bản đồ</span>
            </Link>

            <Link
              to="/areas"
              title="Địa bàn"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-all font-semibold",
                location.pathname.startsWith("/areas") || location.pathname.startsWith("/diaban")
                  ? "bg-white/15 text-white! border border-white/10"
                  : "text-slate-300 hover:text-white! hover:bg-white/5"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Địa bàn</span>
            </Link>

            <Link
              to="/routes"
              title="Tuyến đường"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-all font-semibold",
                location.pathname.startsWith("/routes") || location.pathname.startsWith("/tuyenduong")
                  ? "bg-white/15 text-white! border border-white/10"
                  : "text-slate-300 hover:text-white! hover:bg-white/5"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Tuyến đường</span>
            </Link>
          </div>
        </div>
      </Header>

      <Content className="flex flex-col flex-1 bg-slate-900 overflow-hidden relative">
        {children}
      </Content>
    </Layout>
  );
};
