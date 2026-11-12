// src/app/opengraph-image.tsx
// Default link-preview image (Open Graph and Twitter Card) for every page that
// doesn't set its own. Generated once at build time from the brand wordmark.

import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const alt = 'Massimino - Safe Workouts for Everyone'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'massimino_logo_word.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FBF8F2',
        }}
      >
        {/* The wordmark is 1536x1024 (3:2): scaled to the full card height */}
        <img src={logoSrc} width={945} height={630} alt="" />
      </div>
    ),
    size
  )
}
