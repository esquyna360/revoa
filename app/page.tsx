import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QUIZZES, CATEGORIES } from '@/lib/quizzes'
import { ARTICLES } from '@/lib/articles'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-6 text-xs px-3 py-1 border border-border/60">
            IA que lê o que você não fala
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="gradient-text">Revele</span> o que<br />
            você realmente sente
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
            Quizzes profundos sobre relacionamentos, personalidade e carreira.
            Inteligência artificial que analisa o seu caso específico — não respostas genéricas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-12" asChild>
              <Link href="#quizzes">Fazer um quiz agora</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-border/60 h-12" asChild>
              <Link href="/artigos">Ler artigos</Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-xs text-muted-foreground/60">
            Análise por IA · Sem cadastro · Resultado compartilhável
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={`rounded-xl p-4 bg-gradient-to-br ${cat.color} border border-border/40 text-center`}
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-sm font-medium">{cat.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{cat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quizzes */}
      <section id="quizzes" className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Quizzes em destaque</h2>
              <p className="text-muted-foreground text-sm mt-1">Começa grátis · Resultado completo com IA</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {QUIZZES.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.slug}`}
                className="group block rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/40 hover:bg-card/80 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{quiz.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {quiz.free_questions.length} perguntas grátis
                      </Badge>
                      <span className="text-xs text-muted-foreground/60">· IA personalizada</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Como funciona</h2>
          <p className="text-muted-foreground text-sm mb-10">Simples, rápido e sem cadastro</p>

          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              {
                step: '01',
                title: 'Responda o quiz',
                desc: '5-6 perguntas rápidas sobre o que você está vivendo. Grátis, sem email.',
              },
              {
                step: '02',
                title: 'Veja seu teaser',
                desc: 'A IA mostra o que encontrou. Para a análise completa, desbloqueie por R$9,90.',
              },
              {
                step: '03',
                title: 'Receba sua revelação',
                desc: 'Análise profunda e personalizada. Compartilhe com quem você quiser via link.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-border/40 bg-card/50 p-5">
                <div className="text-primary font-mono text-xs font-bold mb-2 opacity-60">{item.step}</div>
                <h3 className="font-semibold text-sm mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles preview */}
      <section className="px-4 py-12 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Artigos</h2>
              <p className="text-muted-foreground text-sm mt-1">Leituras que te fazem pensar</p>
            </div>
            <Link href="/artigos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {ARTICLES.slice(0, 4).map((article) => (
              <Link
                key={article.id}
                href={`/artigos/${article.slug}`}
                className="group block rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all duration-200"
              >
                <div className="text-2xl mb-3">{article.emoji}</div>
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-xs mt-2 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="px-4 py-16 border-t border-border/30 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-3">Pronto para se descobrir?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Comece com um quiz grátis. Nenhum email necessário.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-12" asChild>
            <Link href="#quizzes">Escolher um quiz</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
