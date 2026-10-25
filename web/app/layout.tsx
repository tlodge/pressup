import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Condensed, Jost } from "next/font/google";
import { TabBar } from "@/components/TabBar";
import "./styles/tokens.css";
import "./styles/components.css";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const barlow = Barlow_Condensed({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-barlow-condensed" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: { default: "PressUp", template: "%s · PressUp" },
  description: "Fitness that fits real life. A training plan that adapts to your time, energy and week.",
  applicationName: "PressUp",
  appleWebApp: { capable: true, title: "PressUp", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" data-theme="dark" className={`${anton.variable} ${barlow.variable} ${jost.variable}`}>
      <body>
        <div className="app">
          <main className="app-main">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
