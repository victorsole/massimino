export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fcfaf5] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-[#2b5069] mb-2">404</h1>
        <p className="font-body text-gray-500 mb-6">This page could not be found.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-[#2b5069] text-white px-5 py-2.5 rounded-lg font-display text-sm uppercase tracking-wider hover:bg-[#1e3d52] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
