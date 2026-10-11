import { Suspense } from 'react'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function MenuContent({ params }: PageProps) {
  const { slug } = await params
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Brew Bari Menu</h1>
      <p className="text-sm text-neutral-500">Shop: {slug}</p>
    </main>
  )
}

export default function GuestMenuPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-4">Loading menu...</div>}>
      <MenuContent {...props} />
    </Suspense>
  )
}
