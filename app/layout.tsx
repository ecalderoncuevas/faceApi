import type { Metadata } from "next";
import { JetBrains_Mono, Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";

const haloSans = Space_Grotesk({
  variable: "--font-halo-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const haloDisplay = Orbitron({
  variable: "--font-halo-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const haloMono = JetBrains_Mono({
  variable: "--font-halo-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "HAL 9000 • Neural Identity Verification",
  description:
    "Sistema de reconocimiento facial con tecnología de redes neuronales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${haloSans.variable} ${haloDisplay.variable} ${haloMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
