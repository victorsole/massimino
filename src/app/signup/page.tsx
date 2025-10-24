// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  ArrowRight,
  User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Call registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created but login failed. Please try logging in manually.');
        setTimeout(() => router.push('/login'), 2000);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setIsLoading(true);
    try {
      const providerMap: { [key: string]: string } = {
        'Google': 'google',
        'LinkedIn': 'linkedin'
      };

      const providerId = providerMap[provider] || provider.toLowerCase();
      await signIn(providerId, { callbackUrl: '/dashboard' });
    } catch (error) {
      setError(`Error signing up with ${provider}`);
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
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Join Massimino</h1>
          <p className="text-brand-primary-light">Start your fitness journey today</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl border-0 bg-brand-secondary/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-semibold text-brand-primary">Create Your Account</CardTitle>
            <CardDescription className="text-center text-brand-primary-light">
              Sign up to get started with personalized fitness coaching
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Social Signup Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialSignup('Google')}
                disabled={isLoading}
                className="h-11 border-brand-primary-light hover:border-brand-primary hover:bg-brand-secondary-dark bg-white/50"
              >
                <Chrome className="h-4 w-4 mr-2 text-red-500" />
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialSignup('LinkedIn')}
                disabled={isLoading}
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

            {/* Divider */}
            <div className="relative">
              <Separator className="my-6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-brand-secondary px-4 text-sm text-brand-primary-light">Or sign up with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-brand-primary">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-primary-light" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-brand-primary-light focus:border-brand-primary focus:ring-brand-primary bg-white/50"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-brand-primary-light focus:border-brand-primary focus:ring-brand-primary bg-white/50"
                    required
                    minLength={8}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-brand-primary">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-primary-light" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-brand-primary-light focus:border-brand-primary focus:ring-brand-primary bg-white/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-primary-light hover:text-brand-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-brand-primary hover:bg-brand-primary-dark text-white font-medium"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-brand-primary-light">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-primary hover:text-brand-primary-dark font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-brand-primary-light">
          <p>By signing up, you agree to our{' '}
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
