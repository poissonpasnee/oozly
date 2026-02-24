import { Suspense } from 'react'
import MessagesClient from './MessagesClient'

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-50 dark:bg-gray-900 pb-24">
          <div className="max-w-[1100px] mx-auto px-4 pt-6">
            <div className="h-10 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
              <div className="h-[70vh] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              <div className="h-[70vh] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            </div>
          </div>
        </main>
      }
    >
      <MessagesClient />
    </Suspense>
  )
}
