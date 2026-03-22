import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
})

const PRICES = {
  quick: { amount: 990, label: 'Revoa — Resultado Completo' },
  premium: { amount: 2490, label: 'Revoa — Quiz Premium + IA Avançada' },
}

export async function POST(req: NextRequest) {
  const { token, quiz_id, tier, email } = await req.json()

  if (!token || !tier || !PRICES[tier as keyof typeof PRICES]) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const price = PRICES[tier as keyof typeof PRICES]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: price.amount,
            product_data: {
              name: price.label,
              description: `Token: ${token}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        token,
        quiz_id,
        tier,
        email: email ?? '',
      },
      success_url: `${appUrl}/r/${token}?paid=1`,
      cancel_url: `${appUrl}/r/${token}`,
    })

    // Store pending payment info
    await supabaseAdmin
      .from('quiz_sessions')
      .update({
        email: email ?? null,
        payment_intent: session.payment_intent,
      })
      .eq('token', token)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
