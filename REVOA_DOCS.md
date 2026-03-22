# Revoa — Documentação para Bruno

Data: 22/03/2026

## Estado Atual do Projeto

### Deploy
- **URL de produção:** https://revoa-ten.vercel.app
- **GitHub:** https://github.com/esquyna360/revoa
- **Vercel project:** brunos-projects-edc9e42d/revoa
- **Supabase:** bexxiiztdqckjgrjltht.supabase.co (mesmo projeto do esquyna-platform)
- **Domínio desejado:** revoas.com (confirmado disponível)

---

## Arquitetura

```
/
├── app/
│   ├── page.tsx              — Home: hero + categorias + quizzes + artigos
│   ├── quiz/[slug]/          — Página do quiz (flow de perguntas)
│   ├── r/[token]/            — Página de resultado (token = identidade)
│   ├── artigos/              — Lista de artigos
│   ├── artigos/[slug]/       — Artigo individual + CTA quiz
│   └── api/
│       ├── quiz/start        — POST: salva respostas, cria sessão, dispara IA
│       ├── quiz/premium      — POST: adiciona perguntas premium após pagamento
│       ├── result/[token]    — GET: polling do status da sessão
│       ├── result/generate   — POST: gera resultado com Claude API
│       ├── payment/checkout  — POST: cria sessão Stripe Checkout
│       ├── webhook/stripe    — POST: processa pagamento, libera resultado
│       └── email/result      — POST: envia resultado por email (Resend)
├── components/
│   ├── Navbar.tsx
│   ├── quiz/QuizFlow.tsx     — UI do quiz (MCQ, scale, free_text)
│   └── result/
│       ├── ResultPageClient.tsx  — Polling + teaser + paywall + resultado
│       └── PaywallModal.tsx      — Modal de pagamento (Quick vs Premium)
├── lib/
│   ├── supabase.ts           — Cliente Supabase (público + admin)
│   ├── anthropic.ts          — Geração de resultado com Claude Sonnet
│   ├── quizzes.ts            — Dados dos quizzes (4 quizzes, 2 categorias)
│   └── articles.ts           — Dados dos artigos (4 artigos)
└── types/index.ts            — Tipos TypeScript
```

## Fluxo do Usuário

1. **Home** → escolhe quiz
2. **Quiz** (5-6 perguntas grátis: MCQ, escala, texto livre)
3. Ao terminar → `POST /api/quiz/start` → cria sessão + dispara IA
4. **Redirect para `/r/[token]`** → polling a cada 2.5s
5. IA gera resultado (10-30s) → status: `ready`
6. **Mostra teaser** (1 seção livre) + blur no resto
7. **Paywall** aparece com 2 opções:
   - R$9,90 → Resultado completo (mesmo AI que já rodou)
   - R$24,90 → Quiz premium (15 perguntas extras + IA mais profunda)
8. **Stripe Checkout** → pagamento → webhook → libera resultado
9. **Email** enviado via Resend com link do resultado
10. **URL compartilhável** — `/r/[token]` é pública e permanente

## Banco de Dados (Supabase)

Tabela: `quiz_sessions`
- `token` (UUID) = identidade do usuário (sem login)
- `answers` (JSONB) = respostas
- `tier` = free | quick | premium
- `status` = pending | generating | ready | error
- `result` (JSONB) = saída da IA
- `payment_id` = ID do Stripe (quando pago)
- `email` = email para resultado

## Quizzes Disponíveis

| Slug | Título | Categoria |
|------|--------|-----------|
| `ele-gosta-de-mim` | Ele Gosta de Mim? | relacionamentos |
| `qual-seu-padrao-amoroso` | Qual é o Seu Padrão Amoroso? | relacionamentos |
| `qual-carreira-combina` | Qual Carreira Combina Com Você? | carreira |
| `meu-eu-sombra` | Qual é o Seu Lado Sombra? | personalidade |

## Artigos Disponíveis

| Slug | Título | Quiz Relacionado |
|------|--------|-----------------|
| `sinais-que-ele-gosta-de-voce-mas-nao-fala` | 7 Sinais de Que Ele Gosta de Você | ele-gosta-de-mim |
| `apego-ansioso-como-identificar` | Apego Ansioso: Você Está Amando ou Sofrendo? | qual-seu-padrao-amoroso |
| `sinais-hora-de-mudar-de-carreira` | Sinais de Que É Hora de Mudar de Carreira | qual-carreira-combina |
| `o-que-a-sombra-revela` | O Que o Que Te Irrita Revela Sobre Você | meu-eu-sombra |

---

## O Que Precisa Ser Configurado

### Stripe (OBRIGATÓRIO para pagamentos)
1. Crie conta em stripe.com
2. Dashboard → Developers → API keys
3. Copie `sk_live_...` e `pk_live_...`
4. No Vercel Dashboard → revoa → Settings → Environment Variables:
   - `STRIPE_SECRET_KEY` = sk_live_...
   - `STRIPE_PUBLISHABLE_KEY` = pk_live_...
5. Configure webhook em Stripe Dashboard → Developers → Webhooks:
   - URL: `https://revoa-ten.vercel.app/api/webhook/stripe`
   - Evento: `checkout.session.completed`
   - Copie o `whsec_...` e salve como `STRIPE_WEBHOOK_SECRET` no Vercel

### Resend (para emails)
1. Crie conta em resend.com
2. Adicione domínio `revoas.com` (ou use o domínio padrão temporariamente)
3. Gere API key
4. No Vercel: `RESEND_API_KEY` = re_...
5. No código (`app/api/email/result/route.ts`): atualize `from: 'Revoa <noreply@revoas.com>'`

### Domínio revoas.com
1. Compre em Cloudflare ($10/ano)
2. No Vercel → revoa → Settings → Domains → adicione `revoas.com`
3. Configure DNS conforme Vercel indicar
4. Atualize `NEXT_PUBLIC_APP_URL` no Vercel para `https://revoas.com`

---

## Checklist de Teste

### Fluxo básico (grátis)
- [ ] Home carrega em https://revoa-ten.vercel.app
- [ ] Clicar em "Ele Gosta de Mim?" → abre quiz
- [ ] Responder todas as 6 perguntas
- [ ] Ao finalizar → redirect para `/r/[token]`
- [ ] Spinner aparece "Analisando suas respostas..."
- [ ] Após 10-30s → resultado aparece com teaser + 1 seção
- [ ] Restante do resultado está desfocado
- [ ] Paywall aparece com R$9,90 e R$24,90

### Artigos
- [ ] /artigos lista os 4 artigos
- [ ] Artigo individual carrega com conteúdo completo
- [ ] CTA do quiz aparece no final do artigo
- [ ] Link do CTA leva ao quiz correto

### Resultado
- [ ] URL /r/[token] é pública (abrir em aba anônima)
- [ ] Botão "Copiar link" copia a URL
- [ ] Botão WhatsApp abre wa.me com texto

### Pagamento (quando Stripe estiver configurado)
- [ ] Clicar em R$9,90 → abre modal PaywallModal
- [ ] Preencher email válido → clicar "Pagar"
- [ ] Redireciona para Stripe Checkout
- [ ] Pagamento com cartão teste: 4242 4242 4242 4242
- [ ] Após pagamento → redirect para /r/[token]?paid=1
- [ ] Resultado completo aparece desbloqueado
- [ ] Email chegou na caixa de entrada

### Mobile
- [ ] Home responsivo no iPhone
- [ ] Quiz responsivo (botões grandes o suficiente)
- [ ] Resultado legível no mobile
- [ ] Modal paywall fecha corretamente

---

## Variáveis de Ambiente Atuais no Vercel

| Variável | Status |
|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ Configurada |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Configurada |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Configurada |
| ANTHROPIC_API_KEY | ✅ Configurada |
| NEXT_PUBLIC_APP_URL | ✅ Configurada |
| STRIPE_SECRET_KEY | ⚠️ Placeholder — configure com chave real |
| STRIPE_WEBHOOK_SECRET | ⚠️ Placeholder — configure após criar webhook |
| RESEND_API_KEY | ⚠️ Placeholder — configure com chave real |

---

## Próximos Passos (Prioridade)

1. **Stripe** — configurar chaves reais e webhook (sem isso, pagamento não funciona)
2. **Resend** — configurar para emails funcionarem
3. **Domínio** — comprar revoas.com e apontar para Vercel
4. **Analytics** — adicionar Vercel Analytics ou Plausible
5. **Mais quizzes** — adicionar em `lib/quizzes.ts`
6. **Mais artigos** — adicionar em `lib/articles.ts`
7. **SEO** — sitemap.xml, meta tags por quiz/artigo
8. **Stripe modo live** — testar com pagamento real antes de divulgar
