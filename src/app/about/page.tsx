import { HeroSection } from "@/components/LandPage/HERO/HERO";
import { KeyFeatures } from "@/components/LandPage/KeyFeatures/KeyFeatures";
import styles from "./page.module.css";
import { WorkFlow } from "@/components/LandPage/WorkFlow/WorkFlow";
import { IdealCustomer } from "@/components/LandPage/IdealCustomer/IdealCustomer";
import { Plans } from "@/components/LandPage/Plans/Plans";
import { FAQs } from "@/components/LandPage/FAQs/FAQs";
import { FooterLand } from "@/components/LandPage/Footer/Footer";
import { Reviews } from "@/components/LandPage/Reviews/Reviews";
import Video from "@/components/LandPage/Video/Video";
import type { Metadata } from "next";
import { Drawer } from "antd";
import { HomeScroll } from "@/components/HomeScroll/HomeScroll";

export const metadata: Metadata = {
  title: "I attend | Guest management & paperless invitations",
  description:
    "Plan events with ease using I attend. Manage your guest list, track RSVPs in real time, and send beautiful paperless invitations — all in one place.",
  keywords: [
    "guest management",
    "event planning",
    "RSVP management",
    "paperless invitations",
    "event guest list",
    "I attend",
  ],
  authors: [{ name: "I attend" }],
  creator: "I attend",
  metadataBase: new URL("https://iattend.site"),
  openGraph: {
    title: "I attend | Plan with ease",
    description:
      "A modern guest management platform to plan events, manage RSVPs, and send paperless invitations effortlessly.",
    url: "https://iattend.site",
    siteName: "I attend",
    images: [
      {
        url: "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/meta.jpg",
        width: 1200,
        height: 630,
        alt: "I attend – Guest management made easy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "I attend | Guest management & event planning",
    description:
      "Manage guests, track RSVPs, and plan events with ease using I attend.",
    images: ["https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/land_page/meta.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default function LandPage() {
  return (
    <div className={styles.main_container_land}>

      <HeroSection></HeroSection>
      <HomeScroll />
      <WorkFlow></WorkFlow>

      <IdealCustomer></IdealCustomer>
      <KeyFeatures></KeyFeatures>

      <Reviews></Reviews>



      <Video></Video>

      <Plans></Plans>
      <FAQs></FAQs>
      {/* <CTA></CTA> */}
      <FooterLand></FooterLand>

     
    </div>
  );
}
