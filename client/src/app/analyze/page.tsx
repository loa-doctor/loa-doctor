import AnalyzeClient from './AnalyzeClient'

async function getRaidData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids`, {
    cache: 'no-store', // 또는 revalidates
  })
  return res.json()
}

export default async function AnalyzePage() {
  const raids = await getRaidData()

  return <AnalyzeClient raids={raids} />
}
