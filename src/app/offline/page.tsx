'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fcfaf5' }}>
      <div className="text-center">
        <img src="/massimino_logo.png" alt="Massimino" className="w-24 h-24 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#2b5069' }}>You&apos;re Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition"
          style={{ backgroundColor: '#2b5069' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
