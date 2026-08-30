import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "FightsAI Ops",
  description: "Frontend and backend foundation for the FightsAI Ops platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-app text-text-strong">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
