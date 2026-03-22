import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import { getQuizBySlug } from '@/lib/quizzes'
import { QuizAnswer } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { quiz_id, answers }: { quiz_id: string; answers: QuizAnswer[] } = body

  const quiz = getQuizBySlug(quiz_id)
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const token = uuidv4()

  // Store the session in Supabase
  const { error } = await supabaseAdmin
    .from('quiz_sessions')
    .insert({
      token,
      quiz_id,
      quiz_slug: quiz.slug,
      quiz_title: quiz.title,
      quiz_category: quiz.category,
      quiz_emoji: quiz.emoji,
      answers: JSON.stringify(answers),
      tier: 'free',
      status: 'pending',
    })

  if (error) {
    console.error('DB error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }

  // Trigger async AI generation (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/result/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, tier: 'free', quiz_id, answers }),
  }).catch(console.error)

  return NextResponse.json({ token })
}
