import type { Metadata } from "next";
import { Lexend_Deca } from "next/font/google";
import { Press_Start_2P } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "BetOnEm - Friend Group Prediction Markets",
  description: "Create prediction markets with your friends. Make friendly bets on real-life events with play money.",
};

// Primary body font
const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Arcade font for hero headline
const pressStart2P = Press_Start_2P({
  variable: "--font-arcade",
  display: "swap",
  subsets: ["latin"],
  weight: ["400"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lexendDeca.variable} ${pressStart2P.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PageTransition>{children}</PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
