export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-secondary px-4">
      <div className="text-center">
        <img src="/massimino_logo.png" alt="Massimino" className="w-24 h-24 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-brand-primary mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
