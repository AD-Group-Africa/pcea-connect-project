import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PCEA Connect — The Digital Church",
    template: "%s | PCEA Connect",
  },
  description:
    "Worship, community, ministries, giving and church life — connected in one secure platform for the Presbyterian Church of East Africa.",
  applicationName: "PCEA Connect",
  keywords: ["PCEA", "church", "Presbyterian Church of East Africa", "worship", "fellowship"],
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
