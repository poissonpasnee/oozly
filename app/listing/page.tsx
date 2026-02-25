import { Suspense } from 'react'
import ListingClient from './_components/ListingClient'

export default function ListingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
          <div className="max-w-[1100px] mx-auto px-4 pt-6">
            <div className="h-10 w-60 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="mt-6 h-[320px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="mt-6 h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        </main>
      }
    >
      <ListingClient />
    </Suspense>
  )
}