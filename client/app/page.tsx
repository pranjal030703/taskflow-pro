import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex justify-between items-center p-6 bg-white shadow-sm">
        <div className="text-2xl font-bold text-blue-600">
          TaskFlow Pro 🚀
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-800 tracking-tight">
          Manage tasks with <span className="text-blue-600">Superpowers.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">
          The simple, powerful, and AI-enhanced Kanban board for developers.
          Stop forgetting tasks and start shipping code.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register">
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-xl hover:scale-105 transition transform">
              Start for Free
            </button>
          </Link>
          <Link href="/board">
            <button className="px-8 py-4 bg-white text-gray-700 border border-gray-300 text-lg font-bold rounded-xl hover:bg-gray-50 transition">
              Go to Board (Demo)
            </button>
          </Link>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="p-6 text-center text-gray-400 text-sm">
        © 2026 TaskFlow Pro. Built for Builders.
      </footer>
    </div>
  );
}