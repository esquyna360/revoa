'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Quiz, QuizAnswer } from '@/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  quiz: Quiz
}

export default function QuizFlow({ quiz }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | number | null>(null)
  const [scaleValue, setScaleValue] = useState<number>(5)

  const questions = quiz.free_questions
  const question = questions[currentIndex]
  const progress = ((currentIndex) / questions.length) * 100
  const isLast = currentIndex === questions.length - 1

  function handleMCQSelect(optionId: string) {
    setCurrentAnswer(optionId)
  }

  function handleScaleChange(value: number) {
    setScaleValue(value)
    setCurrentAnswer(value)
  }

  function handleTextChange(value: string) {
    setCurrentAnswer(value)
  }

  async function handleNext() {
    if (currentAnswer === null && question.type !== 'scale') return

    const answer: QuizAnswer = {
      question_id: question.id,
      value: question.type === 'scale' ? scaleValue : (currentAnswer as string),
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setCurrentAnswer(null)
    setScaleValue(5)

    if (isLast) {
      submitAnswers(newAnswers)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function submitAnswers(finalAnswers: QuizAnswer[]) {
    const token = uuidv4()
    // Fire-and-forget: create session in DB in background, then navigate immediately
    // Result page will wait for session to appear before triggering generation
    fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, quiz_id: quiz.id, answers: finalAnswers }),
    }).catch(console.error)
    router.push(`/r/${token}`)
  }

  const canProceed =
    question?.type === 'scale'
      ? true
      : question?.type === 'free_text'
      ? (currentAnswer as string)?.trim().length > 3
      : currentAnswer !== null

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-3xl mb-3">{quiz.emoji}</div>
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{quiz.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Pergunta {currentIndex + 1} de {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 mb-6">
        <p className="text-base font-medium leading-relaxed mb-6">{question.text}</p>

        {/* MCQ */}
        {question.type === 'mcq' && question.options && (
          <div className="flex flex-col gap-2.5">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleMCQSelect(option.id)}
                className={`text-left rounded-xl border px-4 py-3.5 text-sm transition-all duration-150 ${
                  currentAnswer === option.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/50 hover:border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {/* Scale */}
        {question.type === 'scale' && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{question.scale_min_label}</span>
              <span className="text-foreground font-bold text-lg">{scaleValue}</span>
              <span>{question.scale_max_label}</span>
            </div>
            <input
              type="range"
              min={question.scale_min ?? 1}
              max={question.scale_max ?? 10}
              value={scaleValue}
              onChange={(e) => handleScaleChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50">
              {Array.from({ length: (question.scale_max ?? 10) - (question.scale_min ?? 1) + 1 }).map((_, i) => (
                <span key={i}>{(question.scale_min ?? 1) + i}</span>
              ))}
            </div>
          </div>
        )}

        {/* Free text */}
        {question.type === 'free_text' && (
          <Textarea
            placeholder="Escreva aqui..."
            value={(currentAnswer as string) ?? ''}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={4}
            className="resize-none bg-secondary/50 border-border/50 text-sm"
          />
        )}
      </div>

      {/* Next button */}
      <Button
        onClick={handleNext}
        disabled={!canProceed}
        size="lg"
        className="w-full h-12 bg-primary hover:bg-primary/90 text-white disabled:opacity-40"
      >
        {isLast ? 'Ver meu resultado' : 'Próxima'}
      </Button>

      {/* Skip option for free text */}
      {question.type === 'free_text' && !isLast && (
        <button
          onClick={() => {
            setCurrentAnswer('—')
            setTimeout(handleNext, 50)
          }}
          className="w-full mt-2 text-xs text-muted-foreground/50 hover:text-muted-foreground py-2"
        >
          Pular esta pergunta
        </button>
      )}
    </div>
  )
}
