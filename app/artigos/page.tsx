import Link from 'next/link'
import { ARTICLES } from '@/lib/articles'
import { CATEGORIES } from '@/lib/quizzes'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Artigos — Revoa',
  description: 'Leituras sobre relacionamentos, personalidade, carreira e autoconhecimento.',
}

export default function ArtigosPage() {
  const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Artigos</h1>
        <p className="text-muted-foreground">Leituras que te fazem pensar — e agir.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {ARTICLES.map((article) => {
          const cat = categoryMap[article.category]
          return (
            <Link
              key={article.id}
              href={`/artigos/${article.slug}`}
              className="group block rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all duration-200"
            >
              <div className="text-3xl mb-4">{article.emoji}</div>
              {cat && (
                <Badge variant="secondary" className="text-xs mb-3">
                  {cat.emoji} {cat.name}
                </Badge>
              )}
              <h2 className="font-semibold leading-snug group-hover:text-primary transition-colors mb-2">
                {article.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                {article.description}
              </p>
              <p className="text-xs text-muted-foreground/40 mt-4">
                {new Date(article.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
