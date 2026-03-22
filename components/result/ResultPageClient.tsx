'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuizResult } from '@/types'
import PaywallModal from './PaywallModal'

interface Session {
  token: string
  quiz_id: string
  quiz_title: string
  quiz_emoji: string
  quiz_category: string
  tier: string
  status: string
  result: QuizResult | null
  payment_id?: string
}

export default function ResultPageClient({ token }: { token: string }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fakeProgress, setFakeProgress] = useState(0)

  const isPaid = session?.tier === 'quick' || session?.tier === 'premium'

  useEffect(() => {
    // Fake progress while generating
    const interval = setInterval(() => {
      setFakeProgress((p) => (p < 90 ? p + Math.random() * 15 : p))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let retries = 0
    const maxRetries = 60

    async function poll() {
      try {
        const res = await fetch(`/api/result/${token}`)
        if (!res.ok) {
          router.push('/')
          return
        }
        const data = await res.json()
        setSession(data)
        setLoading(false)

        if (data.status === 'ready') {
          setFakeProgress(100)
          return
        }

        if (data.status === 'error') return

        retries++
        if (retries < maxRetries) {
          setTimeout(poll, 2500)
        }
      } catch {
        setTimeout(poll, 3000)
      }
    }

    poll()
  }, [token, router])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading state
  if (loading || session?.status === 'pending' || session?.status === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-6 animate-pulse">{session?.quiz_emoji ?? '✨'}</div>
        <h2 className="text-xl font-semibold mb-2">Analisando suas respostas...</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          A IA está lendo o padrão por trás das suas respostas. Isso leva alguns segundos.
        </p>
        <div className="w-full max-w-xs">
          <Progress value={fakeProgress} className="h-1.5" />
        </div>
        <p className="text-xs text-muted-foreground/40 mt-4">
          {fakeProgress < 40 ? 'Identificando padrões...' : fakeProgress < 70 ? 'Construindo análise...' : 'Finalizando...'}
        </p>
      </div>
    )
  }

  if (session?.status === 'error' || !session?.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-lg">Algo deu errado. Por favor, tente novamente.</p>
        <Button className="mt-4" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  const result = session.result

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <div className="mb-8">
          <Link href="/" className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
            ← Revoa
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{session.quiz_emoji}</div>
          <Badge variant="secondary" className="mb-3 text-xs">{session.quiz_title}</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight gradient-text">
            {result.headline}
          </h1>
        </div>

        {/* Teaser — always visible */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 mb-6">
          <p className="text-muted-foreground leading-relaxed italic text-center">
            &ldquo;{result.teaser}&rdquo;
          </p>
        </div>

        {/* Free sections — first one always visible */}
        {result.sections.slice(0, 1).map((section, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card/60 p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.emoji}</span>
              <h3 className="font-semibold text-sm">{section.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}

        {/* Paywall or full result */}
        {!isPaid ? (
          <>
            {/* Blurred preview of more sections */}
            <div className="relative rounded-2xl border border-border/50 bg-card/60 p-6 mb-4 overflow-hidden">
              <div className="select-none pointer-events-none blur-sm opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔍</span>
                  <h3 className="font-semibold text-sm">O padrão que você repete</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Há uma dinâmica específica que aparece nas suas respostas, algo que acontece de forma quase automática e que impacta diretamente como você...
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/95 flex items-end justify-center pb-6">
                <button
                  onClick={() => setShowPaywall(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  + 2 seções bloqueadas
                </button>
              </div>
            </div>

            {/* Paywall CTA */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 mb-6 text-center">
              <div className="text-2xl mb-3">🔓</div>
              <h3 className="font-bold text-lg mb-2">Veja a análise completa</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Desbloqueie todas as seções, o diagnóstico completo e o caminho sugerido pela IA.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <button
                  onClick={() => setShowPaywall(true)}
                  className="flex flex-col items-center rounded-xl border border-border/60 bg-secondary/50 hover:border-primary/40 hover:bg-secondary transition-all px-5 py-4"
                >
                  <span className="font-bold text-xl text-primary">R$9,90</span>
                  <span className="text-xs text-muted-foreground mt-1">Resultado completo agora</span>
                </button>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="flex flex-col items-center rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-all px-5 py-4 relative"
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="text-[10px] bg-primary text-white px-2 py-0">MAIS PROFUNDO</Badge>
                  </div>
                  <span className="font-bold text-xl">R$24,90</span>
                  <span className="text-xs text-muted-foreground mt-1">Quiz premium + IA avançada</span>
                </button>
              </div>

              <p className="text-xs text-muted-foreground/50">Pagamento único · Resultado seu para sempre</p>
            </div>
          </>
        ) : (
          <>
            {/* All sections unlocked */}
            {result.sections.slice(1).map((section, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/60 p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{section.emoji}</span>
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}

            {/* Full result */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 mb-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <span>✨</span> Análise completa
              </h3>
              <div
                className="result-content text-sm"
                dangerouslySetInnerHTML={{
                  __html: result.full_result
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/## (.*?)\n/g, '<h2>$1</h2>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>'),
                }}
              />
            </div>
          </>
        )}

        {/* Share section */}
        <div className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-6">
          <p className="text-center text-sm text-muted-foreground mb-3">
            <strong className="text-foreground">&ldquo;{result.share_quote}&rdquo;</strong>
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="text-xs border-border/60"
            >
              {copied ? '✓ Copiado!' : 'Copiar link'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border/60"
              onClick={() => {
                const text = encodeURIComponent(`"${result.share_quote}" — ${window.location.href}`)
                window.open(`https://wa.me/?text=${text}`, '_blank')
              }}
            >
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Try another quiz */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Curioso sobre outra área da sua vida?</p>
          <Button variant="outline" size="sm" asChild className="border-border/60">
            <Link href="/#quizzes">Ver outros quizzes</Link>
          </Button>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          token={token}
          quizId={session.quiz_id}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  )
}
