'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">ProjectMgmt</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.fullName}</span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.fullName}!</h2>
        <p className="text-gray-600">Your workspace will appear here.</p>
      </main>
    </div>
  );
}
