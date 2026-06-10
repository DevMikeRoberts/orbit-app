import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KonamiProvider } from "@/context/KonamiContext";
import { EasterEgg } from "@/components/EasterEgg";
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
  title: "Orbit — Your Life on a Globe",
  description: "Build an interactive 3D portfolio that shows where you've been, what you've built, and who you are.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👋</text></svg>",
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
        <KonamiProvider>
          <EasterEgg />
          {children}
        </KonamiProvider>
      </body>
    </html>
  );
}
