export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { token, email } = await req.json()

  if (!token || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const { data: session } = await supabaseAdmin
    .from('quiz_sessions')
    .select('*')
    .eq('token', token)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const resultUrl = `${appUrl}/r/${token}`

  try {
    await resend.emails.send({
      from: 'Revoa <noreply@revoas.com>',
      to: email,
      subject: `Seu resultado: ${session.quiz_title}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0d0d; color: #f5f5f5; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 8px;">${session.quiz_emoji ?? '✨'}</div>
            <h1 style="font-size: 22px; font-weight: 700; margin: 0; background: linear-gradient(135deg, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Revoa</h1>
          </div>

          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Seu resultado está pronto</h2>
          <p style="color: #888; margin: 0 0 24px; line-height: 1.6;">
            Você completou o quiz <strong style="color: #f5f5f5;">${session.quiz_title}</strong>.
            Sua análise personalizada por IA está esperando por você.
          </p>

          <a
            href="${resultUrl}"
            style="display: block; text-align: center; background: linear-gradient(135deg, #a78bfa, #ec4899); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 16px;"
          >
            Ver minha análise completa
          </a>

          <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
            Ou acesse: <a href="${resultUrl}" style="color: #a78bfa;">${resultUrl}</a><br>
            Este link é seu — guarde-o para sempre.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
