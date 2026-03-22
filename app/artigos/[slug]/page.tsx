import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleBySlug, ARTICLES } from '@/lib/articles'
import { getQuizBySlug } from '@/lib/quizzes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: `${article.title} — Revoa`,
    description: article.description,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) notFound()

  const relatedQuiz = article.related_quiz_slug
    ? getQuizBySlug(article.related_quiz_slug)
    : null

  // Parse markdown-lite to HTML
  const contentHtml = article.content
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
      if (line.startsWith('**') && line.endsWith('**')) return `<p><strong>${line.slice(2, -2)}</strong></p>`
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`
      if (line === '---') return '<hr>'
      if (line.trim() === '') return ''
      return `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
    })
    .join('\n')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/<li>/g, '<ul><li>')
    .replace(/<\/li>/g, '</li></ul>')
    .replace(/<\/ul>\n<ul>/g, '')

  return (
    <article className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <div className="mb-8">
        <Link href="/artigos" className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
          ← Artigos
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="text-4xl mb-4">{article.emoji}</div>
        <Badge variant="secondary" className="text-xs mb-4">{article.category}</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">{article.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{article.description}</p>
        <p className="text-xs text-muted-foreground/40 mt-3">
          {new Date(article.published_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Content */}
      <div
        className="prose-revoa mb-12"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Related quiz CTA */}
      {relatedQuiz && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
          <div className="text-3xl mb-3">{relatedQuiz.emoji}</div>
          <h3 className="font-bold text-lg mb-2">{relatedQuiz.cta_text}</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
            Análise personalizada baseada nas suas respostas específicas. Grátis para começar.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
            <Link href={`/quiz/${relatedQuiz.slug}`}>
              Fazer o quiz — {relatedQuiz.title}
            </Link>
          </Button>
        </div>
      )}

      {/* More articles */}
      <div className="mt-12 pt-8 border-t border-border/30">
        <Link href="/artigos" className="text-sm text-primary hover:underline">
          ← Ver mais artigos
        </Link>
      </div>
    </article>
  )
}

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}
