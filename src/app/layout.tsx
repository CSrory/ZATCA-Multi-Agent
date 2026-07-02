import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bidiqqah | بدقة — Invoice Fraud Detection",
  description:
    "Advanced AI-powered fraud detection for corporate finance invoices. نظام ذكاء اصطناعي للكشف عن الاحتيال في الفواتير.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="antialiased bg-[#FAF5EE] text-[#3D1A08]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
