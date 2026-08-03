import type { Metadata } from "next";
import { AppProvider } from "@/context/AppProvider";
import "@/styles/globals.css";
import { AntdProvider } from "@/context/AntdProvider";
import { GoogleFontsLoader } from "@/components/GoogleFontsLoader";


export const metadata: Metadata = {
  title: "I attend",
  description: "Plan with ease",
  keywords: ["invitaciones digitales", "bodas", "fiestas", "I attend"],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  other: {
    google: "notranslate",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="es" translate="no" className="notranslate">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="google" content="notranslate" />
      </head>
      <body className="scroll-invitation">
        <GoogleFontsLoader />
        <AppProvider>
          <AntdProvider>
            {children}
          </AntdProvider>
        </AppProvider>
      </body>
    </html>
  );
}
