'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, X, Settings } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'massimino_cookie_consent';
const CONSENT_CHANGED_EVENT = 'massimino-consent-changed';
const OPEN_SETTINGS_EVENT = 'massimino-open-cookie-settings';

type CookiePreferences = {
  essential: boolean; // Always true, required for site functionality
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

function readStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Reopen the cookie banner with the detailed preferences expanded,
 * so visitors can change or withdraw consent at any time.
 */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    timestamp: 0,
  });

  useEffect(() => {
    // Check if user has already consented
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Small delay for better UX - don't show immediately on page load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const open = () => {
      const current = readStoredConsent();
      if (current) setPreferences(current);
      setShowDetails(true);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const toSave = { ...prefs, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(toSave));
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setIsVisible(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    // On a phone the banner is a short strip (about a quarter of the screen), not a sheet:
    // one sentence, two equal buttons side by side, and the details one tap away.
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 md:p-6" role="region" aria-label="Cookie choices">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] overflow-y-auto">
          {/* Main Banner */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Cookie Icon */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-brand-primary/10 rounded-full flex-shrink-0">
                <Cookie className="w-6 h-6 text-brand-primary" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Cookie className="w-5 h-5 text-brand-primary sm:hidden" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Cookies on Massimino
                  </h3>
                </div>
                {/* Phone: one sentence. Larger screens: the full explanation. */}
                <p className="text-gray-600 text-sm leading-snug mb-3 sm:hidden">
                  Essential cookies keep the site working. Optional ones help us improve it. Your choice.
                </p>
                <p className="hidden sm:block text-gray-600 text-sm leading-relaxed mb-4">
                  Essential cookies keep Massimino working. Optional cookies help us improve the platform and show you
                  relevant content. You are in control of your choices.
                </p>

                {/* Buttons - Main View */}
                {!showDetails && (
                  // Accepting and declining are the same size and sit side by side
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button
                      onClick={acceptAll}
                      className="flex-1 sm:flex-none bg-brand-primary hover:bg-brand-primary-dark text-white"
                    >
                      Accept all
                    </Button>
                    <Button
                      onClick={acceptEssential}
                      variant="outline"
                      className="flex-1 sm:flex-none border-brand-primary text-brand-primary"
                    >
                      Essential only
                    </Button>
                    <Button
                      onClick={() => setShowDetails(true)}
                      variant="ghost"
                      className="w-full sm:w-auto h-8 sm:h-10 text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Customise
                    </Button>
                  </div>
                )}
              </div>

              {/* Close button (accepts essential only) */}
              <button
                onClick={acceptEssential}
                className="-mr-1 -mt-1 p-2 text-muted-foreground hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                aria-label="Close and accept essential cookies only"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Essential Cookies</h4>
                      <p className="text-sm text-gray-500">Required for the site to function properly</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Always On
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                      <p className="text-sm text-gray-500">Help us understand how you use Massimino</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-orange-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                      <p className="text-sm text-gray-500">Allow personalized content and ads</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
                </div>
              </div>

              {/* Save Preferences Button */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={saveCustom}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="ghost"
                  className="text-gray-600"
                >
                  Back
                </Button>
              </div>

              {/* Privacy Policy Link */}
              <p className="text-xs text-gray-500 mt-4">
                Learn more about how we use cookies in our{' '}
                <a href="/privacy" className="text-brand-primary hover:text-brand-primary-dark underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get current cookie preferences
 * Use this in other components to check user consent before loading tracking scripts
 */
export function useCookieConsent(): CookiePreferences | null {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const sync = () => setConsent(readStoredConsent());
    sync();
    // Stay in sync when consent changes in this tab or another one
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return consent;
}
