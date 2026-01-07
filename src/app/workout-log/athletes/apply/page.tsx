'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Users,
  Shield,
  Star,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  Medal,
  Globe,
  Zap
} from 'lucide-react';

export default function AthleteApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    discipline: '',
    achievements: '',
    instagram: '',
    website: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/athletes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/background/athletism_blue.jpg"
          alt="Elite athlete training"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-white/90 font-medium">Elite Athlete Program</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Share Your Legacy.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Inspire Millions.
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join the ranks of legendary athletes on Massimino. Your proven training methods
            can transform the lives of dedicated fitness enthusiasts worldwide.
          </p>

          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8"
            onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Apply Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-[#254967] to-[#1a2a3e] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-white/70">Active Athletes</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">30+</div>
              <div className="text-white/70">Featured Programs</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">15+</div>
              <div className="text-white/70">Countries</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">4.9</div>
              <div className="text-white/70">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Massimino?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the platform, technology, and audience. You provide the expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Global Reach</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Your programs reach fitness enthusiasts across Europe and beyond.
                Build your international following with our multilingual platform.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Brand Protection</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Your brand, your way. We protect your intellectual property
                and present your programs with the quality they deserve.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Easy Integration</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Our team handles all the technical work. Simply share your
                training methodology and we'll build it into our platform.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Engaged Community</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Connect with dedicated athletes who are serious about training.
                Our community values quality coaching and proven methods.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <Medal className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle>Legacy Building</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Document your training philosophy for future generations.
                Your methods become part of fitness history.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Who We're Looking For
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We partner with elite athletes who have a proven track record of
                excellence and a passion for sharing their knowledge.
              </p>

              <ul className="space-y-4">
                {[
                  'Competitive bodybuilders (IFBB, NPC, NABBA, WBFF)',
                  'Elite powerlifters and strongman competitors',
                  'CrossFit Games athletes and regional competitors',
                  'Olympic weightlifters and strength coaches',
                  'Hyrox champions and functional fitness athletes',
                  'Certified coaches with notable client transformations'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <Image
                src="/images/background/barbell.jpg"
                alt="Barbell training"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#254967] to-[#1a2a3e] rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Featured Athletes</div>
                  <div className="text-sm text-gray-600">Join legends like Arnold, CBUM & more</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply-form" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Apply to Be Featured
            </h2>
            <p className="text-lg text-gray-600">
              Tell us about yourself and your training philosophy.
              We review every application personally.
            </p>
          </div>

          {submitted ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Application Received!
                </h3>
                <p className="text-gray-600 mb-8">
                  Thank you for your interest in partnering with Massimino.
                  Our team will review your application and reach out within 5-7 business days.
                </p>
                <Link href="/workout-log?tab=programs">
                  <Button className="bg-gradient-to-r from-[#254967] to-[#1a2a3e]">
                    Explore Programs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Discipline *
                    </label>
                    <select
                      name="discipline"
                      required
                      value={formData.discipline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    >
                      <option value="">Select your discipline</option>
                      <option value="bodybuilding">Bodybuilding</option>
                      <option value="powerlifting">Powerlifting</option>
                      <option value="crossfit">CrossFit / Functional Fitness</option>
                      <option value="weightlifting">Olympic Weightlifting</option>
                      <option value="strongman">Strongman</option>
                      <option value="hyrox">Hyrox / Hybrid Training</option>
                      <option value="coaching">Professional Coaching</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notable Achievements *
                    </label>
                    <textarea
                      name="achievements"
                      required
                      value={formData.achievements}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                      placeholder="List your major competition results, titles, certifications, or notable client transformations..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="@yourusername"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website / Portfolio
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tell Us About Your Training Philosophy
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                      placeholder="What makes your approach unique? What would athletes gain from following your programs?"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#254967] to-[#1a2a3e] hover:from-[#1e3a52] hover:to-[#152230] font-semibold py-6 disabled:opacity-50"
                    >
                      <Dumbbell className="mr-2 h-5 w-5" />
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                    <p className="text-center text-sm text-gray-500 mt-4">
                      By submitting, you agree to our partnership terms and conditions.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 overflow-hidden">
        <Image
          src="/images/background/kettelbells.jpg"
          alt="Training equipment"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#254967]/95 to-[#1a2a3e]/95" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Share Your Knowledge?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join the elite athletes who are shaping the future of fitness training on Massimino.
          </p>
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8"
            onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Your Application
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
