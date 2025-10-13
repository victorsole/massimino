'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function KnowledgeBasePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function uploadDocument() {
    if (!file) return
    setLoading(true)
    setStatus(null)
    try {
      const text = await file.text()
      const chunks = splitIntoChunks(text, 1200)
      const res = await fetch('/api/massichat/knowledge/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: chunks.map((content, i) => ({ name: `${file.name}_chunk_${i}`, content, metadata: { source: file.name, chunkIndex: i } }))
        })
      })
      if (res.ok) {
        setStatus(`Uploaded ${chunks.length} chunk(s) from ${file.name}`)
      } else {
        const err = await res.json().catch(() => ({}))
        setStatus(`Failed: ${err.error || 'Unknown error'}`)
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitness Knowledge Base</CardTitle>
        <CardDescription>Upload training documents to power Massichat answers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadDocument} disabled={!file || loading}>{loading ? 'Uploading...' : 'Upload & Vectorize'}</Button>
          </div>
          {status && <div className="text-sm text-gray-700">{status}</div>}
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>We’ll split large files into chunks automatically.</li>
            <li>Supported formats: plain text, Markdown (paste as .txt for now).</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let cur = ''
  for (const p of paragraphs) {
    if ((cur + p).length < chunkSize) cur += (cur ? '\n\n' : '') + p
    else { if (cur) chunks.push(cur); cur = p }
  }
  if (cur) chunks.push(cur)
  return chunks
}
