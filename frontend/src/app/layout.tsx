import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono, Lato } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HalluciCheck — LLM Hallucination Detector",
  description: "Closed-domain hallucination detection for large language models using similarity, NLI, and ML classification.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jetbrains.variable} ${lato.variable}`}>
      <body>{children}</body>
    </html>
  );
}
