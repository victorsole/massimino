// src/app/partnerships/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Zap, 
  Target, 
  Shield, 
  BarChart3,
  Smartphone,
  Globe,
  Heart,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone
} from 'lucide-react';
import { LeadDialog, KitDownloadButton } from './lead_dialogs';

export default function PartnershipsPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Partners */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Featured Partners</h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <a href="https://amix.com/?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=amix" target="_blank" rel="noopener" className="group">
              <span className="sr-only">Amix</span>
              <span className="inline-block rounded-xl border bg-white transition-all group-hover:shadow-md group-hover:scale-[1.02]">
                <img src="/images/amix-logo.png" alt="Amix" className="h-12 md:h-14 w-auto object-contain rounded-xl p-2" />
              </span>
            </a>
            <a href="http://app.hellobo.eu?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=bo" target="_blank" rel="noopener" className="group">
              <span className="sr-only">Bo</span>
              <span className="inline-block rounded-xl border bg-white transition-all group-hover:shadow-md group-hover:scale-[1.02]">
                <img src="/images/Bo_logo.png" alt="Bo" className="h-12 md:h-14 w-auto object-contain rounded-xl p-2" />
              </span>
            </a>
            <a href="https://www.jims.be/nl?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=jims" target="_blank" rel="noopener" className="group">
              <span className="sr-only">Jims</span>
              <span className="inline-block rounded-xl border bg-white transition-all group-hover:shadow-md group-hover:scale-[1.02]">
                <img src="/images/jims-logo.png" alt="Jims" className="h-12 md:h-14 w-auto object-contain rounded-xl p-2" />
              </span>
            </a>
          </div>
        </section>

        {/* Partner Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <img src="/images/amix-logo.png" alt="Amix" className="h-8 w-auto rounded" />
                  Amix • Spain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Quality sports supplements — protein, pre‑workout, and recovery essentials.
                </CardDescription>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                  <li>Wide range of evidence‑based products</li>
                  <li>Supports training performance and recovery</li>
                  <li>Trusted by athletes and coaches</li>
                </ul>
                <a href="https://amix.com/?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=amix" target="_blank" rel="noopener" className="inline-block text-brand-primary hover:underline">Visit Amix →</a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <img src="/images/Bo_logo.png" alt="Bo" className="h-8 w-auto rounded" />
                  Bo • Europe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Bo is a social network that links visitors to local producers from all over Europe, whom are called hosts in Bo. Local producers of any category (i.e., wine, beer, vegetables, fruit, fish, crafts, etc.). Bo also shows the geographical indications (GIs) of Europe.
                </CardDescription>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                  <li>Connects visitors with local producer “hosts” across Europe</li>
                  <li>Covers all categories: wine, beer, produce, fish, crafts</li>
                  <li>Highlights Europe’s geographical indications (GIs)</li>
                </ul>
                <a href="http://app.hellobo.eu?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=bo" target="_blank" rel="noopener" className="inline-block text-brand-primary hover:underline">Visit Bo →</a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <img src="/images/jims-logo.png" alt="Jims" className="h-8 w-auto rounded" />
                  Jims • Belgium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Accessible gym network with multiple locations and flexible memberships.
                </CardDescription>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                  <li>Convenient locations across Belgium</li>
                  <li>Great value membership options</li>
                  <li>Friendly, supportive environment</li>
                </ul>
                <a href="https://www.jims.be/nl?utm_source=massimino&utm_medium=partnerships_page&utm_campaign=jims" target="_blank" rel="noopener" className="inline-block text-brand-primary hover:underline">Visit Jims →</a>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-gray-500 mt-3">Partnership details subject to change.</p>
        </section>

        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Partner with Massimino
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join the future of fitness technology. Partner with Massimino to reach 
            millions of fitness enthusiasts and professionals worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LeadDialog variant="generic" size="lg" />
            <KitDownloadButton variant="outline" size="lg" />
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Easy Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>SDK/API/white‑label options with branded experiences.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Targeted Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Contextual placements across feed, workouts, teams.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>Clear Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Impressions, clicks, CTR, and pacing transparency.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Partnership Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Partnership Opportunities
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gym Partnerships */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Gym Partnerships</CardTitle>
                    <Badge variant="secondary">Plugin Integration</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Integrate Massimino directly into your gym's mobile app or management system. 
                  Your trainers and athletes can seamlessly access Massimino's features.
                </CardDescription>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>White-label integration options</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Custom branding and themes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>API access for seamless data sync</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Revenue sharing opportunities</span>
                  </div>
                </div>

                <LeadDialog variant="gym" fullWidth />
              </CardContent>
            </Card>

            {/* Advertising Partnerships */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Advertising Partnerships</CardTitle>
                    <Badge variant="secondary">Sponsored Content</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Reach our engaged fitness community with targeted advertising for 
                  supplements, equipment, apparel, and fitness services.
                </CardDescription>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Highly targeted fitness audience</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Multiple ad formats and placements</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Detailed analytics and reporting</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Flexible budget options</span>
                  </div>
                </div>

                <LeadDialog variant="ad" fullWidth />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Partner with Massimino?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Growing Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access to thousands of active fitness enthusiasts and professionals
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Trusted platform with advanced safety and moderation features
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Data Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive analytics and insights for better decision making
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Easy Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple APIs and documentation for quick implementation
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" /> Gyms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-blue-600" />Explore</div>
                    <CardDescription>Scoping call + sandbox access</CardDescription>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-blue-600" />Integrate</div>
                    <CardDescription>SDK/API with branding & features</CardDescription>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle className="h-4 w-4 text-blue-600" />Launch</div>
                    <CardDescription>Pilot → rollout with analytics</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" /> Advertisers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-amber-600" />Brief</div>
                    <CardDescription>Goals + placements + dates</CardDescription>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><Zap className="h-4 w-4 text-amber-600" />Submit</div>
                    <CardDescription>Upload creatives with specs</CardDescription>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4 text-amber-600" />Approve</div>
                    <CardDescription>Moderation + QA review</CardDescription>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium"><BarChart3 className="h-4 w-4 text-amber-600" />Measure</div>
                    <CardDescription>Impressions, clicks, CTR</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Integration Examples — commented out for later */}
        {/*
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Integration Examples
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
                  <CardTitle>Mobile Apps</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Integrate Massimino's workout tracking and coach features directly 
                  into your gym's mobile application.
                </CardDescription>
                <div className="mt-4">
                  <Badge variant="outline">iOS & Android</Badge>
                  <Badge variant="outline" className="ml-2">React Native</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Globe className="h-8 w-8 text-green-600 mr-3" />
                  <CardTitle>Web Platforms</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Embed Massimino's features into your gym's website or member portal 
                  for seamless user experience.
                </CardDescription>
                <div className="mt-4">
                  <Badge variant="outline">JavaScript SDK</Badge>
                  <Badge variant="outline" className="ml-2">REST API</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Heart className="h-8 w-8 text-red-600 mr-3" />
                  <CardTitle>Wearable Devices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with fitness trackers and smartwatches to automatically 
                  sync workout data and progress.
                </CardDescription>
                <div className="mt-4">
                  <Badge variant="outline">Apple Watch</Badge>
                  <Badge variant="outline" className="ml-2">Fitbit</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        */}

        {/* Success Stories — commented out for later */}
        {/*
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Success Stories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">FitLife Gym Chain</h3>
                    <p className="text-sm text-gray-500">50+ locations</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Integrating Massimino into our app increased member engagement by 40% 
                  and helped our trainers provide better personalized guidance."
                </p>
                <div className="flex space-x-2">
                  <Badge variant="secondary">+40% Engagement</Badge>
                  <Badge variant="secondary">+25% Retention</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">ProteinPlus Supplements</h3>
                    <p className="text-sm text-gray-500">Fitness Brand</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Our targeted ads on Massimino resulted in 3x higher conversion rates 
                  compared to other fitness platforms."
                </p>
                <div className="flex space-x-2">
                  <Badge variant="secondary">3x Conversions</Badge>
                  <Badge variant="secondary">ROI +150%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        */}

        {/* Contact Section */}
        <section className="bg-gray-50 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Partner with Us?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Get in touch with our partnership team to discuss how Massimino can 
              help grow your business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg">
                <Mail className="h-5 w-5 mr-2" />
                helloberesol@gmail.com
              </Button>
              <Button variant="outline" size="lg">
                <Phone className="h-5 w-5 mr-2" />
                +32 493 36 5423
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Technical Support</h3>
                <p className="text-sm text-gray-600">
                  Dedicated technical team for seamless integration
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Marketing Support</h3>
                <p className="text-sm text-gray-600">
                  Co-marketing opportunities and promotional materials
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-sm text-gray-600">
                  Round-the-clock support for all partnership needs
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
