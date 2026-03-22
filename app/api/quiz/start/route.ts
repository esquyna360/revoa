export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase'
import { getQuizBySlug } from '@/lib/quizzes'
import { QuizAnswer } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { quiz_id, answers, token: providedToken }: { quiz_id: string; answers: QuizAnswer[]; token?: string } = body

  const quiz = getQuizBySlug(quiz_id)
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const token = providedToken ?? uuidv4()

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
      answers,
      tier: 'free',
      status: 'pending',
    })

  if (error) {
    console.error('DB error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }

  // Return token immediately — client will trigger generation
  return NextResponse.json({ token, quiz_id, answers })
}
