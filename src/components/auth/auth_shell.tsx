// Shared frame for the small auth pages (forgot / reset password), matching /login.
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background/dumbells_gloves_01.jpg"
          alt=""
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/60 to-brand-secondary-dark/60" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Image src="/massimino_logo.png" alt="Massimino" width={96} height={96} className="object-contain" />
        </div>
        <Card className="shadow-xl border-0 bg-brand-secondary/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-brand-primary">{title}</CardTitle>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
