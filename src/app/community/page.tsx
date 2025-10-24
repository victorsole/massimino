import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Community | Massimino',
  description: 'Join the Massimino fitness community and connect with trainers and athletes',
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-secondary-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <Image
                src="/ionicons.designerpack/people.svg"
                alt="Community"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-brand-primary mb-4">Community</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with fitness enthusiasts, find trainers, join teams, and achieve your goals together
            in a safe and supportive environment.
          </p>
        </div>

        {/* Research-Backed Difference */}
        <div className="mb-12">
          <Card className="border-2 border-brand-primary bg-white">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/ionicons.designerpack/bulb.svg"
                    alt="Research"
                    fill
                    className="object-contain"
                  />
                </div>
                <CardTitle className="text-2xl">A Different Approach to Fitness</CardTitle>
              </div>
              <CardDescription className="text-base">
                Research shows traditional fitness apps can harm motivation and well-being.
                Massimino was built differently.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Recent research on commercial fitness apps revealed significant problems: rigid calorie counting
                that triggers shame and guilt, algorithmic goals that ignore individual needs, and competitive
                features that undermine motivation rather than build it.
              </p>

              <p className="text-gray-700 font-semibold">
                Massimino addresses these issues head-on with an evidence-based approach:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Well-Being Over Numbers</h4>
                    <p className="text-sm text-gray-600">
                      We focus on your overall health and happiness, not just calories burned or weight lost
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Holistic Approach</h4>
                    <p className="text-sm text-gray-600">
                      Combine professional guidance, community support, proper technique, and sustainable habits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Safety-First Design</h4>
                    <p className="text-sm text-gray-600">
                      Built-in protections, verified trainers, and moderation to prevent the harms other apps create
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Personalized & Adaptive</h4>
                    <p className="text-sm text-gray-600">
                      Real trainers who understand your unique needs, not one-size-fits-all algorithms
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Intrinsic Motivation</h4>
                    <p className="text-sm text-gray-600">
                      Build lasting motivation through mastery, autonomy, and genuine connection—not shame or guilt
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                  <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                    <Image
                      src="/ionicons.designerpack/checkmark-circle.svg"
                      alt="Check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">Human-Centered</h4>
                    <p className="text-sm text-gray-600">
                      Built for people by people—trainers, teams, and community support at the core
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-brand-secondary to-brand-secondary-dark rounded-lg">
                <p className="text-sm text-gray-700 italic">
                  "Unlike apps that reduce fitness to numbers and algorithms, Massimino combines verified
                  professional guidance with supportive community features to help you build sustainable,
                  healthy habits—without the shame, guilt, or harmful obsession with quantification."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/person-add-outline.svg"
                  alt="Find Trainers"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Find Trainers</CardTitle>
              <CardDescription className="text-center">
                Connect with verified professional trainers who can guide your fitness journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teams/discover">
                <Button variant="outline" className="w-full">
                  Discover Trainers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/people-circle.svg"
                  alt="Join Teams"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Join Teams</CardTitle>
              <CardDescription className="text-center">
                Be part of fitness teams and train alongside others with similar goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teams/discover">
                <Button variant="outline" className="w-full">
                  Browse Teams
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/chatbubbles.svg"
                  alt="Chat & Connect"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Chat & Connect</CardTitle>
              <CardDescription className="text-center">
                Communicate with your trainers and teammates through secure messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/messages">
                <Button variant="outline" className="w-full">
                  View Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/trophy.svg"
                  alt="Leaderboards"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Leaderboards</CardTitle>
              <CardDescription className="text-center">
                Track your progress and see how you rank with other community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Leaderboards
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/barbell.svg"
                  alt="Share Workouts"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Log Workouts</CardTitle>
              <CardDescription className="text-center">
                Track and share your workout progress with your trainers and community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workout-log">
                <Button variant="outline" className="w-full">
                  Workout Log
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/stats-chart.svg"
                  alt="Track Progress"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-center">Track Progress</CardTitle>
              <CardDescription className="text-center">
                Monitor your fitness journey with detailed analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* MassiChat Feature */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative">
                <Image
                  src="/ionicons.designerpack/sparkles.svg"
                  alt="MassiChat"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-2xl">MassiChat AI Assistant</CardTitle>
                <CardDescription>Get personalized workout guidance and fitness advice</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Interact with our AI-powered fitness assistant for personalized workout suggestions,
              form analysis, and expert guidance tailored to your goals.
            </p>
            <Link href="/massichat">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Chat with MassiChat
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Community Values */}
        <Card className="mb-8 bg-brand-primary text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Our Community Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/ionicons.designerpack/heart-circle.svg"
                  alt="Respect"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Respect & Support</h3>
                <p className="text-brand-secondary">
                  We foster a positive environment where everyone supports each other's fitness journey
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/ionicons.designerpack/people.svg"
                  alt="Inclusivity"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Inclusivity</h3>
                <p className="text-brand-secondary">
                  All fitness levels and backgrounds are welcome - from beginners to professionals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/ionicons.designerpack/shield-checkmark.svg"
                  alt="Safety"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Safety First</h3>
                <p className="text-brand-secondary">
                  We prioritize safety with verified trainers, content moderation, and safety guidelines
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image
                  src="/ionicons.designerpack/ribbon.svg"
                  alt="Quality"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Quality & Expertise</h3>
                <p className="text-brand-secondary">
                  Work with accredited professionals and access high-quality fitness resources
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/ionicons.designerpack/star.svg"
                    alt="Assessments"
                    fill
                    className="object-contain"
                  />
                </div>
                <CardTitle>Fitness Assessments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get evaluated by professional trainers to understand your current fitness level
                and receive personalized recommendations.
              </p>
              <Link href="/assessments">
                <Button variant="outline">View Assessments</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/ionicons.designerpack/fitness.svg"
                    alt="Exercises"
                    fill
                    className="object-contain"
                  />
                </div>
                <CardTitle>Exercise Library</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive library of exercises with video demonstrations,
                form tips, and safety instructions.
              </p>
              <Link href="/exercises">
                <Button variant="outline">Browse Exercises</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="inline-block max-w-2xl">
            <CardContent className="pt-6">
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/ionicons.designerpack/rocket.svg"
                  alt="Get Started"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-brand-primary mb-4">
                Ready to Join the Community?
              </h2>
              <p className="text-gray-600 mb-6">
                Start your fitness journey today and connect with trainers and athletes who share your goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-dark">
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/teams/discover">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Teams
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Please review our{' '}
            <Link href="/safety" className="text-brand-primary hover:text-brand-primary-dark font-semibold">
              Safety Guidelines
            </Link>{' '}
            to ensure a safe and positive experience for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
