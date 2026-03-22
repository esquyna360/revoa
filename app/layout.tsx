import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revoa — Autoconhecimento com IA",
  description: "Descubra o que voce realmente quer, sente e precisa. Quizzes profundos com analise por inteligencia artificial.",
  openGraph: {
    title: "Revoa — Autoconhecimento com IA",
    description: "Descubra o que voce realmente quer, sente e precisa.",
    siteName: "Revoa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/50 py-8 mt-16">
          <div className="max-w-4xl mx-auto px-4 text-center text-muted-foreground text-sm">
            <p>© 2026 Revoa. Todos os direitos reservados.</p>
            <p className="mt-1 text-xs opacity-60">Autoconhecimento com inteligencia artificial</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
