import React from "react";
import { EnvironmentOutlined, ForkOutlined } from "@ant-design/icons";
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
            <div className="bg-red-600 text-white p-2 rounded flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="flex flex-col justify-center leading-tight shrink-0">
              <span className="font-semibold text-sm whitespace-nowrap">PC08 GIS</span>
            </div>
          </div>

          <div className="flex h-full items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/areas"
              title="Địa bàn"
              className={cn(
                "px-3 py-2 rounded-md flex items-center gap-2 shrink-0 transition-colors",
                location.pathname.startsWith("/areas") || location.pathname.startsWith("/diaban")
                  ? "bg-red-600! text-white!"
                  : "text-red-600! hover:bg-red-50!"
              )}
            >
              <EnvironmentOutlined />
              <span className="font-medium text-sm hidden md:inline whitespace-nowrap">Địa bàn</span>
            </Link>

            <Link
              to="/routes"
              title="Tuyến đường"
              className={cn(
                "px-3 py-2 rounded-md flex items-center gap-2 shrink-0 transition-colors",
                location.pathname.startsWith("/routes") || location.pathname.startsWith("/tuyenduong")
                  ? "bg-red-600! text-white!"
                  : "text-red-600! hover:bg-red-50!"
              )}
            >
              <ForkOutlined />
              <span className="font-medium text-sm hidden md:inline whitespace-nowrap">Tuyến đường</span>
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
