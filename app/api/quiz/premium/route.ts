import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getQuizBySlug } from '@/lib/quizzes'
import { QuizAnswer } from '@/types'

// Called after payment to submit premium answers and trigger premium AI generation
export async function POST(req: NextRequest) {
  const { token, answers }: { token: string; answers: QuizAnswer[] } = await req.json()

  // Verify this token is actually paid for premium
  const { data: session } = await supabaseAdmin
    .from('quiz_sessions')
    .select('*')
    .eq('token', token)
    .eq('tier', 'premium')
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found or not premium' }, { status: 403 })
  }

  const existingAnswers: QuizAnswer[] = session.answers ? JSON.parse(session.answers) : []
  const allAnswers = [...existingAnswers, ...answers]

  // Update answers and trigger new generation
  await supabaseAdmin
    .from('quiz_sessions')
    .update({ answers: JSON.stringify(allAnswers), status: 'pending' })
    .eq('token', token)

  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/result/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      tier: 'premium',
      quiz_id: session.quiz_id,
      answers: allAnswers,
    }),
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}
