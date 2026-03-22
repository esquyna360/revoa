import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateQuizResult(
  quizTitle: string,
  quizCategory: string,
  answers: Array<{ question: string; answer: string }>,
  tier: 'quick' | 'premium'
) {
  const tierLabel = tier === 'premium' ? 'analise profunda e detalhada' : 'analise reveladora'

  const systemPrompt = `Voce e um oraculo de autoconhecimento com profunda intuicao humana.
Voce recebe as respostas de um quiz e gera uma ${tierLabel} em portugues brasileiro.
Seja direto, emocional, preciso. Use linguagem acolhedora mas honesta.
Evite jargoes psicologicos. Fale como se conhecesse a pessoa.
Formato de resposta: JSON valido conforme especificado.`

  const answersText = answers.map((a, i) => `${i + 1}. ${a.question}\nResposta: ${a.answer}`).join('\n\n')

  const userPrompt = `Quiz: "${quizTitle}" (categoria: ${quizCategory})

Respostas do usuario:
${answersText}

Gere uma ${tierLabel} no seguinte formato JSON:
{
  "teaser": "1-2 frases que capturam a essencia sem revelar tudo",
  "headline": "titulo impactante da revelacao (max 10 palavras)",
  "share_quote": "frase curta e marcante para compartilhar (max 20 palavras)",
  "sections": [
    {
      "emoji": "emoji relevante",
      "title": "titulo da secao",
      "content": "paragrafo de analise (3-5 frases)"
    }
  ],
  "full_result": "analise completa em markdown (${tier === 'premium' ? '400-600' : '200-300'} palavras)"
}

${tier === 'premium' ? 'Inclua 4-5 secoes cobrindo: padrao central, o que isso revela, ponto cego, caminho sugerido, mensagem final.' : 'Inclua 2-3 secoes cobrindo: padrao central, revelacao principal, proximos passos.'}

Responda APENAS com o JSON valido, sem markdown code blocks.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: tier === 'premium' ? 2000 : 1200,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON if wrapped in text
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse AI response')
  }
}
