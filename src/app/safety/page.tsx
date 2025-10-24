import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Safety Guidelines | Massimino',
  description: 'Safety guidelines and best practices for using Massimino fitness platform',
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-secondary-dark py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <Image
                src="/ionicons.designerpack/shield-checkmark.svg"
                alt="Safety"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-brand-primary mb-4">Safety Guidelines</h1>
          <p className="text-lg text-gray-600">
            Your safety is our top priority. Please read and follow these guidelines.
          </p>
        </div>

        {/* Workout Safety */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/ionicons.designerpack/heart-circle.svg"
                  alt="Workout Safety"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle>Workout Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Consult Your Doctor</h3>
                <p className="text-gray-600">
                  Before starting any new exercise program, consult with your healthcare provider,
                  especially if you have any pre-existing medical conditions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Warm Up and Cool Down</h3>
                <p className="text-gray-600">
                  Always warm up before exercise and cool down afterwards to prevent injuries
                  and improve recovery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Use Proper Form</h3>
                <p className="text-gray-600">
                  Focus on proper technique over heavy weights. Poor form can lead to serious injuries.
                  Use our exercise library for form demonstrations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Listen to Your Body</h3>
                <p className="text-gray-600">
                  Stop immediately if you feel pain, dizziness, or excessive fatigue.
                  It's better to rest than to risk injury.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Stay Hydrated</h3>
                <p className="text-gray-600">
                  Drink water before, during, and after your workouts to maintain proper hydration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Safety */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/ionicons.designerpack/shield.svg"
                  alt="Platform Safety"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle>Platform Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Verify Trainer Credentials</h3>
                <p className="text-gray-600">
                  Only work with verified trainers who have proper certifications and credentials
                  displayed on their profiles. Look for the verification badge.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Protect Your Privacy</h3>
                <p className="text-gray-600">
                  Never share personal information like your home address, phone number, or
                  financial details in public messages.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Report Inappropriate Behavior</h3>
                <p className="text-gray-600">
                  Use the report feature if you encounter harassment, spam, or inappropriate content.
                  Our moderation team reviews all reports promptly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Your Account</h3>
                <p className="text-gray-600">
                  Use a strong, unique password and never share your login credentials with anyone.
                  Enable two-factor authentication when available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Safety */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/ionicons.designerpack/people.svg"
                  alt="Community Safety"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle>Community Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Be Respectful</h3>
                <p className="text-gray-600">
                  Treat all community members with respect and kindness. Harassment, discrimination,
                  and bullying are not tolerated.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">No Medical Advice</h3>
                <p className="text-gray-600">
                  Do not provide medical advice unless you are a licensed healthcare professional.
                  Always recommend consulting a doctor for medical concerns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 relative flex-shrink-0 mt-0.5">
                <Image
                  src="/ionicons.designerpack/checkmark-circle.svg"
                  alt="Check"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share Responsibly</h3>
                <p className="text-gray-600">
                  Only share content you have the right to share. Respect intellectual property
                  and others' privacy when posting workout videos or photos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MassiChat Safety */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/ionicons.designerpack/sparkles.svg"
                  alt="MassiChat"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-purple-900">Using MassiChat AI Assistant</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-purple-900">
            <p>
              MassiChat is an AI-powered assistant designed to provide general fitness guidance.
              Please keep these important points in mind:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>MassiChat provides general fitness information, not medical advice</li>
              <li>Always consult a healthcare provider before starting a new fitness program</li>
              <li>AI suggestions should be reviewed by your personal trainer</li>
              <li>Report any concerning or inappropriate AI responses to our team</li>
            </ul>
          </CardContent>
        </Card>

        {/* Emergency Warning */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/ionicons.designerpack/warning.svg"
                  alt="Emergency"
                  fill
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-orange-900">Emergency Situations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-900 mb-4 font-semibold">
              If you experience any of the following during exercise, stop immediately and seek medical attention:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Chest pain or pressure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Severe shortness of breath</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Dizziness or fainting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Irregular heartbeat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Severe pain or discomfort</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src="/ionicons.designerpack/close-circle.svg"
                    alt="Warning"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-orange-900">Numbness or tingling</span>
              </div>
            </div>
            <p className="text-orange-900 font-bold bg-orange-100 p-3 rounded-md">
              ⚠️ In case of emergency, call your local emergency services immediately.
            </p>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-gray-600">
            For more information, please review our{' '}
            <Link href="/terms" className="text-brand-primary hover:text-brand-primary-dark font-semibold">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-primary hover:text-brand-primary-dark font-semibold">
              Privacy Policy
            </Link>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="inline-block text-brand-primary hover:text-brand-primary-dark font-semibold">
              Return to Dashboard
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <Link href="/community" className="inline-block text-brand-primary hover:text-brand-primary-dark font-semibold">
              Join the Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
