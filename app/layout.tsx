import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JPEG Image Compressor & Resizer",
  description: "Resize, crop, compress and convert your photos instantly in the browser.",
  openGraph: {
    title: "JPEG Image Compressor & Resizer",
    description: "Resize, crop, compress and convert your photos instantly in the browser.",
    url: "https://agentic-94343254.vercel.app",
    siteName: "JPEG Image Compressor",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-100 bg-slate-950">
        {children}
      </body>
    </html>
  );
}
