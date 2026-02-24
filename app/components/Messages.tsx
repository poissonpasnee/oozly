'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Messages({ onClose }: { onClose: () => void }) {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<any[]>([])
  
  return (
    <div className="fixed inset-0 bg-white z-[4000] flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Messages</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-gray-200">✕</button>
      </div>
      <div className="flex-1 p-4">
        <div className="text-center text-gray-500 mt-20">
          💬 Messagerie connectée à tes tables Supabase
          <br/><small>conversations + messages</small>
        </div>
      </div>
    </div>
  )
}
