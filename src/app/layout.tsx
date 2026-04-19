import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nosana Chat",
  description:
    "Nosana Chat — a decentralized AI assistant for deploying, managing, and chatting with models on the Nosana network.",
  icons: {
    icon: "/nosana.png",
    apple: "/nosana.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased flex">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
