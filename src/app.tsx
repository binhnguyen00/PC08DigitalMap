import React from "react";
import { Refine, RefineProps } from "@refinedev/core";
import { App as AntDesignApp, ConfigProvider, Spin } from "antd";
import viVN from "antd/locale/vi_VN";
import routerProvider, { DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { ErrorComponent, RefineThemes } from "@refinedev/antd";

import { AppLayout } from "./components/AppLayout";
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
        name: "diaban",
        list: "/diaban",
        show: "/diaban/show/:id",
        meta: {
          label: "Địa bàn",
        },
      },
      {
        name: "tuyenduong",
        list: "/tuyenduong",
        show: "/tuyenduong/show/:id",
        meta: {
          label: "Tuyến đường",
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
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
            </React.Suspense>

            <DocumentTitleHandler handler={() => "PC08 GIS"} />
          </Refine>
        </AntDesignApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
