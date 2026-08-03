import { Layout, theme } from "antd";
import { Link, useLocation } from "react-router";
import { cn } from "@/libs/tailwind";

const { Header, Content } = Layout;

export const AppLayout = ({ children }: React.PropsWithChildren) => {
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <Layout style={{ background: token.colorBgLayout }} className="h-screen font-sans flex flex-col overflow-hidden">
      <Header style={{ background: token.colorBgContainer }} className="border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between h-16 shrink-0 gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-6 h-full min-w-0">
          <div className="flex items-center gap-2 h-full shrink-0">
            <div className="flex flex-col justify-center leading-tight shrink-0">
              <span className="font-bold text-base text-red-600 whitespace-nowrap">PC08 GIS</span>
            </div>
          </div>

          <div className="flex h-full items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/overview"
              title="Bản đồ"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-colors",
                location.pathname === "/overview" || location.pathname === "/"
                  ? "bg-red-600! text-white!"
                  : "text-red-600! hover:bg-red-50!"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Bản đồ</span>
            </Link>

            <Link
              to="/areas"
              title="Địa bàn"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-colors",
                location.pathname.startsWith("/areas") || location.pathname.startsWith("/diaban")
                  ? "bg-red-600! text-white!"
                  : "text-red-600! hover:bg-red-50!"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Địa bàn</span>
            </Link>

            <Link
              to="/routes"
              title="Tuyến đường"
              className={cn(
                "px-3 py-2 rounded-md flex items-center shrink-0 transition-colors",
                location.pathname.startsWith("/routes") || location.pathname.startsWith("/tuyenduong")
                  ? "bg-red-600! text-white!"
                  : "text-red-600! hover:bg-red-50!"
              )}
            >
              <span className="font-medium text-sm whitespace-nowrap">Tuyến đường</span>
            </Link>
          </div>
        </div>
      </Header>

      <Content className="flex flex-col flex-1 bg-[#f8f9fa] overflow-y-auto">
        {children}
      </Content>
    </Layout>
  );
};
