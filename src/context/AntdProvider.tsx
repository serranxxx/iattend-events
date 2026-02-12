"use client";
import "@ant-design/v5-patch-for-react-19";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import es_ES from "antd/locale/es_ES";

export const AntdProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AntdRegistry>
      <ConfigProvider
        modal={{
          centered: true,
          closable: false,
          styles: {
            body: {
              backgroundColor: "var(--brand-color-500)",
              paddingTop: "6px",
              borderRadius: "20px",
            },
          },
        }}
        locale={es_ES}
        theme={{
          components: {
            Breadcrumb: {
              borderRadiusOuter: 999,
              borderRadius: 999,
              borderRadiusLG: 999,
              borderRadiusSM: 999,
              borderRadiusXS: 999,
              separatorMargin: 6,
            },
            Spin: {
              colorPrimary: "#A7A5A5",
            },
            Modal: {
              boxShadow: "0 0 24px rgba(0, 0, 0, 0.25)",
              borderRadius: 20,
              borderRadiusLG: 20,
              borderRadiusSM: 20,
              borderRadiusXS: 20,
              padding: 0,
              paddingContentHorizontal: 0,
              paddingContentHorizontalLG: 0,
              paddingContentVertical: 0,
              paddingContentVerticalLG: 0,
              paddingContentHorizontalSM: 0,
              paddingContentVerticalSM: 0,
              paddingLG: 0,
              paddingSM: 0,
              paddingXS: 0,
              paddingMD: 0,
              paddingXL: 0,
              paddingXXS: 0,
            },
            Button: {
              borderRadius: 99,
              colorPrimary: "var(--brand-color-500)",
              colorPrimaryActive: "var(--brand-color-500-40)",
              colorPrimaryHover: "var(--brand-color-500-80)",
              fontWeight: 600,
              fontSizeSM: 12,
              lineHeightSM: 16,
              fontSize: 14,
              lineHeight: 16,
              fontSizeLG: 16,
              lineHeightLG: 20,
              defaultBg: "var(--secondary-color-500)",
              defaultBorderColor: "transparent",
              defaultColor: "var(--text-color-300)",
              defaultHoverBg: "var(--secondary-color-300)",
              defaultHoverColor: "var(--text-color-300)",
              defaultHoverBorderColor: "transparent",
              defaultActiveBg: "var(--secondary-color-700)",
              defaultActiveBorderColor: "transparent",
              defaultActiveColor: "var(--text-color-300)",
              borderColorDisabled: "transparent",
            },
            Input: {
              borderRadius: 999,
              // colorBorder: "#EBEBEB",
              // colorPrimary: "#DA303A",
              // colorPrimaryActive: "#B72831",
              // colorPrimaryHover: "#E0515A",
              activeShadow: "none",
              fontSize: 12,
            },
            DatePicker: {
              borderRadius: 999,
              colorBorder: "#EBEBEB",
              colorPrimary: "#DA303A",
              colorPrimaryActive: "#B72831",
              colorPrimaryHover: "#E0515A",
              activeShadow: "none",
              fontSize: 12,
            },
            Collapse: {
              headerPadding: "12px 8px",
              contentPadding: "0",
            },
            Radio: {
              colorPrimary: "var(--brand-color-500)",
              colorPrimaryActive: "var(--brand-color-700)",
              colorPrimaryHover: "var(--brand-color-600)",
              borderRadius: 99,
              borderRadiusSM: 99,
              buttonCheckedBg: "var(--brand-color-500-20)",
              buttonSolidCheckedBg: "var(--brand-color-500-50)",
            },
            Segmented: {
              borderRadius: 99,
              borderRadiusOuter: 99,
              borderRadiusLG: 99,
              borderRadiusSM: 99,
              colorBgBase: "var(--secondary-color-200)",
              colorBgContainer: "red",
              colorBgElevated: "var(--brand-color-500)",
              colorText: "#FFF",
              itemHoverColor: "var(--text-color-300)",
              itemHoverBg: "var(--secondary-color-200)",
              itemActiveBg: "var(--secondary-color-300)",
              fontWeightStrong: 400,
              fontSize: 12,
            },
            Select: {
              borderRadius: 99,
              borderRadiusSM: 99,
              colorPrimary: "var(--brand-color-500)",
              hoverBorderColor: "var(--brand-color-500)",
              activeOutlineColor: "var(--brand-color-50)",
              controlItemBgActive: "var(--brand-color-50)",
              colorBorder: "var(--border-color)",
            },
            Calendar: {
              itemActiveBg: "var(--secondary-color-50)",
              colorPrimary: "red",
              controlItemBgHover: "var(--secondary-color-400-80)",
              colorSplit: "var(--secondary-color-500)",
              borderRadiusSM: 99, // controlHeightSM:8,
              // controlHeightLG: 44
              // yearControlWidth:
            },
            Notification: {
              borderRadius:36
            }
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
};
