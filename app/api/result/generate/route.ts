export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQuizResult } from '@/lib/anthropic'
import { getQuizBySlug } from '@/lib/quizzes'
import { QuizAnswer } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    token,
    tier,
    quiz_id,
    answers,
  }: { token: string; tier: 'quick' | 'premium'; quiz_id: string; answers: QuizAnswer[] } = body

  // Mark as generating
  await supabaseAdmin
    .from('quiz_sessions')
    .update({ status: 'generating', tier })
    .eq('token', token)

  const quiz = getQuizBySlug(quiz_id)
  if (!quiz) {
    await supabaseAdmin
      .from('quiz_sessions')
      .update({ status: 'error' })
      .eq('token', token)
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // Build question-answer pairs for the prompt
  const allQuestions = [...quiz.free_questions, ...quiz.premium_questions]
  const answerPairs = answers.map((a) => {
    const question = allQuestions.find((q) => q.id === a.question_id)
    if (!question) return null

    let answerText = String(a.value)
    if (question.type === 'mcq' && question.options) {
      const option = question.options.find((o) => o.id === a.value)
      answerText = option?.text ?? answerText
    }

    return { question: question.text, answer: answerText }
  }).filter(Boolean) as Array<{ question: string; answer: string }>

  try {
    const result = await generateQuizResult(quiz.title, quiz.category, answerPairs, tier)

    await supabaseAdmin
      .from('quiz_sessions')
      .update({
        status: 'ready',
        result,
      })
      .eq('token', token)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('AI generation error:', err)
    await supabaseAdmin
      .from('quiz_sessions')
      .update({ status: 'error' })
      .eq('token', token)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
