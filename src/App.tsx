import React from "react";
import { Refine, RefineProps } from "@refinedev/core";
import { App as AntDesignApp, ConfigProvider, Spin } from "antd";
import viVN from "antd/locale/vi_VN";
import routerProvider, { DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { ErrorComponent, RefineThemes } from "@refinedev/antd";

import { AppLayout } from "./components/AppLayout";
import { ManagementAreaPage, CameraMapPage } from "./pages";
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
        name: "management-area",
        list: "/management-area",
        meta: {
          label: "Địa bàn quản lý",
        },
      },
      {
        name: "cameras",
        list: "/cameras",
        meta: {
          label: "Bản đồ Camera",
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
                  <Route index element={<Navigate to="/management-area" replace />} />
                  <Route path="/management-area" element={<ManagementAreaPage />} />
                  <Route path="/cameras" element={<CameraMapPage />} />
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
            </React.Suspense>

            <DocumentTitleHandler handler={() => "Bản đồ số PC08"} />
          </Refine>
        </AntDesignApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
