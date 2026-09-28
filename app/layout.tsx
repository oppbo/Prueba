import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CobraYa — Cuentas por cobrar para empresas bolivianas",
    template: "%s · CobraYa",
  },
  description:
    "Cobra más rápido. Controla cada boliviano pendiente. Cuentas por cobrar, recordatorios por WhatsApp y pagos con QR en un solo lugar.",
  applicationName: "CobraYa",
  openGraph: {
    title: "CobraYa — Cobra más rápido",
    description: "Cuentas por cobrar, recordatorios y pagos en un solo lugar.",
    locale: "es_BO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d7a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-BO" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
