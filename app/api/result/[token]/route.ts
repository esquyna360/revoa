export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data, error } = await supabaseAdmin
    .from('quiz_sessions')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    token: data.token,
    quiz_id: data.quiz_id,
    quiz_title: data.quiz_title,
    quiz_emoji: data.quiz_emoji,
    quiz_category: data.quiz_category,
    tier: data.tier,
    status: data.status,
    result: data.result ?? null,
    answers: data.answers, // needed by client to trigger generation
    payment_id: data.payment_id,
    created_at: data.created_at,
  })
}
