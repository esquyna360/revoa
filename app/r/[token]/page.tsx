import ResultPageClient from '@/components/result/ResultPageClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ResultPage({ params }: Props) {
  const { token } = await params
  return <ResultPageClient token={token} />
}
