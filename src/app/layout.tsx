import type { Metadata } from "next";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { ModalProvider } from "@/components/ui/modal-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "truxOS - Efisiensi Biaya & Operasional Armada",
  description:
    "Maksimalkan keuntungan logistik Anda dengan manajemen armada berbasis data. truxOS memberikan perhitungan biaya operasional yang presisi, analitik real-time, dan wawasan yang dapat ditindaklanjuti.",
  keywords: [
    "manajemen armada",
    "biaya truk",
    "logistik",
    "analitik armada",
    "biaya operasional",
    "manajemen transportasi",
  ],
  openGraph: {
    title: "truxOS - Efisiensi Biaya & Operasional Armada",
    description:
      "Platform manajemen armada berbasis data untuk operator logistik modern.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-surface-50">
        <NotificationProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}

