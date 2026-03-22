import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { QuizAnswer } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any
    const { token, quiz_id, tier, email } = session.metadata ?? {}

    if (!token || !tier) return NextResponse.json({ ok: true })

    // Get current session data
    const { data: quizSession } = await supabaseAdmin
      .from('quiz_sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (!quizSession) return NextResponse.json({ ok: true })

    // For premium tier, we need to re-generate with all answers
    // For quick tier, just unlock the existing result
    const tierTyped = tier as 'quick' | 'premium'

    if (quizSession.status === 'ready' && tierTyped === 'quick') {
      // Already have result, just mark as paid
      await supabaseAdmin
        .from('quiz_sessions')
        .update({ tier: 'quick', payment_id: session.id, email })
        .eq('token', token)
    } else {
      // Mark as paid and trigger regeneration
      await supabaseAdmin
        .from('quiz_sessions')
        .update({ tier: tierTyped, payment_id: session.id, email, status: 'pending' })
        .eq('token', token)

      const answers: QuizAnswer[] = quizSession.answers ? JSON.parse(quizSession.answers) : []

      // Trigger async generation
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/result/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tier: tierTyped, quiz_id, answers }),
      }).catch(console.error)
    }

    // Send email if we have one
    if (email) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      }).catch(console.error)
    }
  }

  return NextResponse.json({ ok: true })
}
