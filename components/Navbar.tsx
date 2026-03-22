'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  // Hide navbar on quiz/result pages for immersive experience
  if (pathname.startsWith('/quiz/') || pathname.startsWith('/r/')) return null

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          <span className="gradient-text">Revoa</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/artigos" className="hover:text-foreground transition-colors">
            Artigos
          </Link>
          <Link
            href="/#quizzes"
            className="hover:text-foreground transition-colors"
          >
            Quizzes
          </Link>
        </nav>
      </div>
    </header>
  )
}
