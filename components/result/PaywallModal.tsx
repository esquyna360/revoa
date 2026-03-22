'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  token: string
  quizId: string
  onClose: () => void
}

export default function PaywallModal({ token, quizId, onClose }: Props) {
  const [selected, setSelected] = useState<'quick' | 'premium'>('quick')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const prices = {
    quick: { label: 'Resultado completo', price: 'R$9,90', desc: 'Análise completa baseada nas suas respostas' },
    premium: { label: 'Quiz premium + IA avançada', price: 'R$24,90', desc: '15 perguntas extras + análise mais profunda com campos livres' },
  }

  async function handleCheckout() {
    if (!email.includes('@')) {
      setError('Informe um email válido para receber seu resultado.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, quiz_id: quizId, tier: selected, email }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erro ao criar checkout. Tente novamente.')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border/60 p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl leading-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔓</div>
          <h2 className="text-xl font-bold">Desbloquear análise completa</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha o nível que faz sentido para você</p>
        </div>

        {/* Plan selector */}
        <div className="flex flex-col gap-3 mb-6">
          {(Object.entries(prices) as Array<[typeof selected, typeof prices[keyof typeof prices]]>).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`text-left rounded-xl border p-4 transition-all ${
                selected === key
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-border bg-secondary/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{plan.label}</span>
                <span className={`font-bold ${selected === key ? 'text-primary' : ''}`}>{plan.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">{plan.desc}</p>
            </button>
          ))}
        </div>

        {/* Email */}
        <div className="mb-4">
          <Label htmlFor="email" className="text-sm mb-1.5 block">
            Seu email (para receber resultado)
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="bg-secondary/50 border-border/50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        <Button
          onClick={handleCheckout}
          disabled={loading}
          size="lg"
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
        >
          {loading ? 'Aguarde...' : `Pagar ${prices[selected].price}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground/50 mt-3">
          Pagamento seguro via Stripe · Resultado seu para sempre
        </p>
      </div>
    </div>
  )
}
