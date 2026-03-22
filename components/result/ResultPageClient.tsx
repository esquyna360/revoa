'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fakeProgress, setFakeProgress] = useState(0)
  const generationTriggered = useRef(false)

  const isPaid = session?.tier === 'quick' || session?.tier === 'premium'
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://revoa-ten.vercel.app/r/${token}`

  // Fake progress animation while generating
  useEffect(() => {
    const interval = setInterval(() => {
      setFakeProgress((p) => (p < 88 ? p + Math.random() * 12 : p))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  // Poll for result status
  useEffect(() => {
    let cancelled = false
    let retries = 0
    const maxRetries = 80      // ~3.5 min total
    let notFoundRetries = 0
    const maxNotFound = 15     // wait up to ~15s for session to appear in DB

    async function poll() {
      if (cancelled) return
      try {
        const res = await fetch(`/api/result/${token}`)

        if (res.status === 404) {
          // Session not in DB yet — the background fetch from QuizFlow may still be in flight
          notFoundRetries++
          if (notFoundRetries >= maxNotFound) {
            setLoading(false)
            setNotFound(true)
            return
          }
          setTimeout(poll, 1000)
          return
        }

        if (!res.ok) {
          setLoading(false)
          setNotFound(true)
          return
        }

        const data = await res.json()
        if (!cancelled) {
          setSession(data)
          setLoading(false)
        }

        if (data.status === 'ready') {
          setFakeProgress(100)
          return
        }
        if (data.status === 'error') return

        // Trigger generation from client if still pending (serverless-safe)
        if (data.status === 'pending' && !generationTriggered.current) {
          generationTriggered.current = true
          const answers = data.answers ?? []
          fetch('/api/result/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              tier: 'free',
              quiz_id: data.quiz_id,
              answers: typeof answers === 'string' ? JSON.parse(answers) : answers,
            }),
          }).catch(console.error)
        }

        retries++
        if (retries < maxRetries) {
          setTimeout(poll, 2500)
        }
      } catch {
        if (!cancelled) setTimeout(poll, 3000)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [token])

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading / generating state
  if (loading || session?.status === 'pending' || session?.status === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-6 animate-pulse">{session?.quiz_emoji ?? '✨'}</div>
        <h2 className="text-xl font-semibold mb-2">
          {session?.quiz_title ?? 'Preparando...'}
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs leading-relaxed">
          A IA está lendo o padrão por trás das suas respostas.
          Isso leva alguns segundos — você pode fechar e voltar pelo link.
        </p>

        <div className="w-full max-w-xs mb-2">
          <Progress value={fakeProgress} className="h-1.5" />
        </div>
        <p className="text-xs text-muted-foreground/40 mb-10">
          {fakeProgress < 35 ? 'Identificando padrões...' : fakeProgress < 65 ? 'Construindo análise...' : 'Finalizando...'}
        </p>

        {/* Share link visible even while loading */}
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-4 max-w-xs w-full">
          <p className="text-xs text-muted-foreground mb-3">Seu link único — guarde ou compartilhe:</p>
          <p className="text-xs text-primary/80 font-mono break-all mb-3 select-all">{shareUrl}</p>
          <button
            onClick={copyLink}
            className="text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg px-3 py-1.5 w-full transition-colors"
          >
            {copied ? '✓ Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-lg">Link inválido ou sessão expirada.</p>
        <p className="text-sm text-muted-foreground">Refaça o quiz para gerar um novo resultado.</p>
        <Button asChild>
          <Link href="/">Ver quizzes</Link>
        </Button>
      </div>
    )
  }

  if (session?.status === 'error' || !session?.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-lg">Algo deu errado ao gerar seu resultado.</p>
        <p className="text-sm text-muted-foreground">Tente refazer o quiz ou entre em contato.</p>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  const result = session.result

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-10">
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

        {/* First section always free */}
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
            {/* Blurred preview */}
            <div className="relative rounded-2xl border border-border/50 bg-card/60 p-6 mb-4 overflow-hidden">
              <div className="select-none pointer-events-none blur-sm opacity-40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔍</span>
                  <h3 className="font-semibold text-sm">O padrão que você repete</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Há uma dinâmica específica que aparece nas suas respostas, algo que acontece de forma quase automática e que impacta diretamente como você se relaciona e toma decisões...
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/95 flex items-end justify-center pb-5">
                <button onClick={() => setShowPaywall(true)} className="text-xs text-muted-foreground hover:text-foreground">
                  + mais seções bloqueadas
                </button>
              </div>
            </div>

            {/* Paywall CTA */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 mb-6 text-center">
              <div className="text-2xl mb-3">🔓</div>
              <h3 className="font-bold text-lg mb-2">Desbloqueie a análise completa</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Veja todas as seções, o diagnóstico completo e o caminho sugerido pela IA — só para o seu caso.
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
              <p className="text-xs text-muted-foreground/50">Pagamento único · Link seu para sempre</p>
            </div>
          </>
        ) : (
          <>
            {result.sections.slice(1).map((section, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/60 p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{section.emoji}</span>
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
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

        {/* Share — always visible after result loads */}
        <div className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-6">
          <p className="text-center text-sm font-medium mb-1">Compartilhe seu resultado</p>
          {result.share_quote && (
            <p className="text-center text-xs text-muted-foreground mb-4 italic">
              &ldquo;{result.share_quote}&rdquo;
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={copyLink} className="text-xs border-border/60">
              {copied ? '✓ Copiado!' : 'Copiar link'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border/60"
              onClick={() => {
                const text = encodeURIComponent(`"${result.share_quote}" — ${shareUrl}`)
                window.open(`https://wa.me/?text=${text}`, '_blank')
              }}
            >
              WhatsApp
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Curioso sobre outra área da sua vida?</p>
          <Button variant="outline" size="sm" asChild className="border-border/60">
            <Link href="/#quizzes">Ver outros quizzes</Link>
          </Button>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal token={token} quizId={session.quiz_id} onClose={() => setShowPaywall(false)} />
      )}
    </>
  )
}
