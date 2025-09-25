import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-secondary-dark border-t border-brand-primary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-brand-primary mb-4">Massimino</h3>
            <p className="text-gray-600 mb-4">
              The safety-first fitness community platform for trainers and enthusiasts. 
              Safe workouts for everyone.
            </p>
            <p className="text-sm text-gray-500">
              Massimino is a product of Beresol BV. Copyright of Beresol BV
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/workout-log" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Workout Log
                </Link>
              </li>
              <li>
                <Link href="/exercises" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Exercises
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Partnerships */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-4">
              Partnerships
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/partnerships" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Gym Partnerships
                </Link>
              </li>
              <li>
                <Link href="/partnerships#advertising" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Advertising
                </Link>
              </li>
              <li>
                <Link href="/partnerships#api" className="text-gray-600 hover:text-brand-primary transition-colors">
                  API Integration
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 Beresol BV. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
              <Link href="/safety" className="text-sm text-gray-500 hover:text-gray-700">
                Safety Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
