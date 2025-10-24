'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Chrome,
  Linkedin,
  Facebook,
  Instagram,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Handle URL params for success/error messages
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (successParam === 'email-verified') {
      setSuccess('Email verified successfully! You can now sign in.');
    } else if (successParam === 'already-verified') {
      setSuccess('Your email is already verified. You can sign in.');
    }

    if (errorParam === 'invalid-token') {
      setError('Invalid verification link. Please request a new one.');
    } else if (errorParam === 'token-expired') {
      setError('Verification link has expired. Please request a new one.');
    } else if (errorParam === 'verification-failed') {
      setError('Email verification failed. Please try again.');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      // Map provider names to NextAuth provider IDs
      const providerMap: { [key: string]: string } = {
        'Google': 'google',
        'LinkedIn': 'linkedin',
        'Facebook': 'facebook',
        'Instagram': 'instagram'
      };
      
      const providerId = providerMap[provider] || provider.toLowerCase();
      await signIn(providerId, { callbackUrl: '/dashboard' });
    } catch (error) {
      setError(`Error signing in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-secondary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/massimino_logo.png"
              alt="Massimino Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Welcome Back</h1>
          <p className="text-brand-primary-light">Sign in to continue your fitness journey</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-brand-secondary/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-semibold text-brand-primary">Sign In</CardTitle>
            <CardDescription className="text-center text-brand-primary-light">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-brand-primary">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-primary-light" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-brand-primary-light focus:border-brand-primary focus:ring-brand-primary bg-white/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-brand-primary">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-primary-light" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-brand-primary-light focus:border-brand-primary focus:ring-brand-primary bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-primary-light hover:text-brand-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-primary-light rounded"
                  />
                  <Label htmlFor="remember" className="text-sm text-brand-primary-light">
                    Remember me
                  </Label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-brand-primary hover:bg-brand-primary-dark text-white font-medium"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <Separator className="my-6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-brand-secondary px-4 text-sm text-brand-primary-light">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Google')}
                className="h-11 border-brand-primary-light hover:border-brand-primary hover:bg-brand-secondary-dark bg-white/50"
              >
                <Chrome className="h-4 w-4 mr-2 text-red-500" />
                Google
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('LinkedIn')}
                className="h-11 border-brand-primary-light hover:border-brand-primary hover:bg-brand-secondary-dark bg-white/50"
              >
                <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                LinkedIn
              </Button>
              
              <Button
                variant="outline"
                disabled
                className="h-11 border-brand-primary-light bg-white/30 cursor-not-allowed relative"
                title="Coming soon"
              >
                <Facebook className="h-4 w-4 mr-2 text-blue-700 opacity-50" />
                <span className="opacity-50">Facebook</span>
                <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              </Button>

              <Button
                variant="outline"
                disabled
                className="h-11 border-brand-primary-light bg-white/30 cursor-not-allowed relative"
                title="Coming soon"
              >
                <Instagram className="h-4 w-4 mr-2 text-pink-500 opacity-50" />
                <span className="opacity-50">Instagram</span>
                <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-brand-primary-light">
                Don't have an account?{' '}
                <Link href="/signup" className="text-brand-primary hover:text-brand-primary-dark font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-brand-primary-light">
          <p>By signing in, you agree to our{' '}
            <Link href="/terms" className="text-brand-primary hover:text-brand-primary-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-primary hover:text-brand-primary-dark">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-secondary to-brand-secondary-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-primary">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
