export type QuestionType = 'mcq' | 'scale' | 'free_text'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  text: string
  type: QuestionType
  options?: QuizOption[]
  scale_min?: number
  scale_max?: number
  scale_min_label?: string
  scale_max_label?: string
}

export interface Quiz {
  id: string
  slug: string
  title: string
  description: string
  category: string
  emoji: string
  free_questions: QuizQuestion[]
  premium_questions: QuizQuestion[]
  cta_text: string
  created_at: string
}

export interface QuizAnswer {
  question_id: string
  value: string | number
}

export interface QuizSession {
  id: string
  token: string
  quiz_id: string
  answers: QuizAnswer[]
  tier: 'free' | 'quick' | 'premium'
  status: 'pending' | 'generating' | 'ready' | 'error'
  result?: QuizResult
  payment_id?: string
  email?: string
  created_at: string
}

export interface QuizResult {
  teaser: string
  headline: string
  full_result: string
  sections: ResultSection[]
  share_quote: string
}

export interface ResultSection {
  title: string
  content: string
  emoji: string
}

export interface Article {
  id: string
  slug: string
  title: string
  description: string
  content: string
  category: string
  emoji: string
  related_quiz_slug?: string
  published_at: string
}

export type Category = {
  id: string
  name: string
  emoji: string
  description: string
  color: string
}
