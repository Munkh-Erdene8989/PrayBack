import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          📚 Bookstore SaaS
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Олон дэлгүүртэй онлайн номын худалдааны платформ
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Нэвтрэх
          </Link>
        </div>
      </div>
    </main>
  );
}
