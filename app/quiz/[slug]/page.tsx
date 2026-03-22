import { notFound } from 'next/navigation'
import { getQuizBySlug } from '@/lib/quizzes'
import QuizFlow from '@/components/quiz/QuizFlow'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params
  const quiz = getQuizBySlug(slug)

  if (!quiz) notFound()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <QuizFlow quiz={quiz} />
    </div>
  )
}

export async function generateStaticParams() {
  const { QUIZZES } = await import('@/lib/quizzes')
  return QUIZZES.map((q) => ({ slug: q.slug }))
}
