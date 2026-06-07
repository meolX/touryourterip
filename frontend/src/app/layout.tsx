import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TourYourTrip — Find Your Perfect Stay",
    template: "%s | TourYourTrip",
  },
  description:
    "Discover hotels, PGs, villas and resorts across India. Book instantly with the best prices.",
  keywords: ["travel", "hotel booking", "villa", "resort", "PG", "India stays"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "TourYourTrip",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
