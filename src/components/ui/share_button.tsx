'use client'

import { Button } from '@/components/ui/button'

export function ShareButton({ shareUrl, shareText }: { shareUrl: string; shareText: string }) {
  const handleClick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareText, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      }
    } catch {
      // ignore
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      Share
    </Button>
  )
}

