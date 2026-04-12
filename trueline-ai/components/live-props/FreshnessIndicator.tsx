'use client'
import { useState, useEffect } from 'react'

interface Props {
  lastUpdated: number
}

export function FreshnessIndicator({ lastUpdated }: Props) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const color = secondsAgo < 30 ? 'text-green-400' :
                secondsAgo < 90 ? 'text-yellow-400' : 'text-red-400'

  return (
    <span className={`text-xs font-mono ${color}`}>
      {secondsAgo < 5 ? 'just updated' : `${secondsAgo}s ago`}
    </span>
  )
}