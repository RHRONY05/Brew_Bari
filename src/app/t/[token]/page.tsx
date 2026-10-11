import { Suspense } from 'react'

interface PageProps {
  params: Promise<{ token: string }>
}

async function TableContent({ params }: PageProps) {
  const { token } = await params
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Brew Bari Table Service</h1>
      <p className="text-sm text-neutral-500">Token: {token}</p>
    </main>
  )
}

export default function TableServicePage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading table service...</div>}>
      <TableContent {...props} />
    </Suspense>
  )
}
