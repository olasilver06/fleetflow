import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import GlobalNav from "@/components/GlobalNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FleetFlow — Last-mile delivery, tracked",
  description: "Last-mile delivery, tracked in real time.",
  icons: {
    icon: [
      { url: "/fleetflow-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/fleetflow-favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Runs before hydration/paint so a stored "light" preference
            applies immediately — otherwise the page would flash dark
            (the default) before ThemeToggle's own effect corrects it. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.getItem("fleetflow-theme") === "light") {
                document.documentElement.classList.add("light");
              }
            } catch (e) {}
          `}
        </Script>
        <GlobalNav />
        {children}
      </body>
    </html>
  );
}
