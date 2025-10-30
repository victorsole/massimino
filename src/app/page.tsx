import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/core/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Users,
  Dumbbell,
  Heart,
  CheckCircle as _CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  let rows: Array<any> = []

  try {
    const db: any = prisma as any
    if (db?.partners?.findMany) {
      rows = await db.partners.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
    }
  } catch (error) {
    // Database unavailable during build - use fallback partners only
    console.warn('Database unavailable, using fallback partners')
  }

  const fallback = [
    { name: 'Amix', url: 'https://amix.com/?utm_source=massimino&utm_medium=partner_band&utm_campaign=amix', logoUrl: '/images/amix-logo.png', blurb: 'Quality sports supplements' },
    { name: 'Bo', url: 'http://app.hellobo.eu?utm_source=massimino&utm_medium=partner_band&utm_campaign=bo', logoUrl: '/images/Bo_logo.png', blurb: 'Local producer network' },
    // Temporarily remove Jims from public display pending formal agreement
    // { name: 'Jims', url: 'https://www.jims.be/nl?utm_source=massimino&utm_medium=partner_band&utm_campaign=jims', logoUrl: '/images/jims-logo.png', blurb: 'Accessible gym network' },
  ]
  const byName = new Set<string>()
  const partners = [...fallback, ...(rows || [])].filter((p: any) => {
    const key = (p.name || '').toLowerCase().trim()
    if (!key) return false
    // Exclude Jims from homepage partner band
    if (key === 'jims') return false
    if (byName.has(key)) return false
    byName.add(key)
    return true
  })

  const normalizeLogo = (logoUrl: string | null | undefined) =>
    (logoUrl || '').replace(/^\/assets\/images\//, '/images/')
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-secondary to-brand-secondary-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                <Image
                  src="/massimino_logo.png"
                  alt="Massimino Logo"
                  fill
                  sizes="120px"
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-brand-primary mb-4">
              Massimino
            </h1>
            <p className="text-xl text-brand-primary-light mb-8">
              Safe Workouts for Everyone
            </p>
            <p className="text-lg text-brand-primary max-w-3xl mx-auto mb-12">
              The safety-first fitness community platform where trainers and athletes connect, 
              track workouts, and achieve goals together in a secure environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark">
                  Sign Up
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-brand-primary text-brand-primary hover:bg-brand-secondary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
  </section>

      {/* Partners Band */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-6">Trusted by partners</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {partners.map((p: any) => (
              <Link key={p.name || p.id} href={p.url || '#'} target="_blank" rel="noopener" className="group">
                <span className="sr-only">{p.name}</span>
                <span className="inline-block rounded-xl border bg-white transition-all group-hover:shadow-md group-hover:scale-[1.02]">
                  <Image
                    src={normalizeLogo(p.logoUrl)}
                    alt={p.name || 'Partner'}
                    width={140}
                    height={44}
                    className="object-contain rounded-xl p-2"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-brand-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Massimino?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with safety, community, and results in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Advanced moderation and safety features ensure a secure environment for all users.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Expert Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with verified trainers and get personalized workout guidance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Smart Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track workouts, progress, and achievements with our intelligent logging system.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Join a supportive community of fitness enthusiasts and professionals.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-brand-secondary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-600">
                Create your account and choose your role as an athlete or trainer.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect</h3>
              <p className="text-gray-600">
                Find trainers or athletes and establish your fitness partnerships.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Track & Grow</h3>
              <p className="text-gray-600">
                Log workouts, receive feedback, and achieve your fitness goals together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-brand-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Massimino has transformed how I train my athletes. The safety features and 
                  workout tracking make everything so much more professional."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Victor</p>
                    <p className="text-sm text-gray-500">Personal Trainer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Molt recomanable, m'ajuda en els meus entrenaments individuals."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Josep</p>
                    <p className="text-sm text-gray-500">Fitness Enthusiast</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Massichat has helped me craft a workout log to get back in shape after my pregnancy!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Charlotte</p>
                    <p className="text-sm text-gray-500">Post-natal mum</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-xl text-brand-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already achieving their fitness goals with Massimino.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
