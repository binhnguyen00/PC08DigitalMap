import React from "react";
import { Refine, RefineProps } from "@refinedev/core";
import { App as AntDesignApp, ConfigProvider, Spin } from "antd";
import viVN from "antd/locale/vi_VN";
import routerProvider, { DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { ErrorComponent, RefineThemes } from "@refinedev/antd";

import { AppLayout } from "./components/AppLayout";
import { AreaPage, RoutePage } from "./pages";
import { dataProvider } from "./providers/dataProvider";
import { i18nProvider } from "./providers/i18nProvider";

import "@refinedev/antd/dist/reset.css";

function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

export default function App() {
  const refine: RefineProps = {
    routerProvider: routerProvider,
    dataProvider: dataProvider,
    i18nProvider: i18nProvider,
    options: {
      mutationMode: "pessimistic",
    },
    resources: [
      {
        name: "areas",
        list: "/areas",
        show: "/areas/show/:id",
        meta: {
          label: "Areas",
        },
      },
      {
        name: "routes",
        list: "/routes",
        show: "/routes/show/:id",
        meta: {
          label: "Routes",
        },
      },
    ],
  };

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue} locale={viVN}>
        <AntDesignApp>
          <Refine {...refine}>
            <React.Suspense fallback={<Loader />}>
              <Routes>
                <Route
                  element={
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  }
                >
                  <Route index element={<Navigate to="/areas" replace />} />
                  <Route path="/areas" element={<AreaPage />} />
                  <Route path="/routes" element={<RoutePage />} />
                  <Route path="/diaban" element={<Navigate to="/areas" replace />} />
                  <Route path="/tuyenduong" element={<Navigate to="/routes" replace />} />
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
            </React.Suspense>

            <DocumentTitleHandler handler={() => "PC08 Digital Map"} />
          </Refine>
        </AntDesignApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
