import type { Metadata } from "next";
import { AppProvider } from "@/context/AppProvider";
import "@/styles/globals.css";
import { AntdProvider } from "@/context/AntdProvider";


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
  }
};


export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton+SC&family=Kaisei+Opti&family=Lilita+One&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Libre+Franklin:ital,wght@0,100..900;1,100..900&family=Signika:wght@300..700&family=Comfortaa:wght@300..700&family=DM+Serif+Display:ital@0;1&family=Dancing+Script:wght@400..700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Platypi:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quicksand:wght@300..700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Sedan:ital@0;1&family=Work+Sans:ital,wght@0,100..900;1,100..900&family=Cedarville+Cursive&family=Edu+NSW+ACT+Cursive:wght@400..700&family=Fredoka:wght@300..700&family=Tangerine:wght@400;700&family=WindSong:wght@400;500&family=Monsieur+La+Doulaise&display=swap&family=Geom:ital,wght@0,300..900;1,300..900"
          rel="stylesheet"
        />
      </head>
      <body className="scroll-invitation">
        <AppProvider>
          <AntdProvider>
            {children}
          </AntdProvider>
        </AppProvider>
      </body>
    </html>
  );
}
