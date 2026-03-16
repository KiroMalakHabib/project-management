'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { MY_ORGANIZATIONS_QUERY } from '@/graphql/queries/organization.queries';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data } = useQuery(MY_ORGANIZATIONS_QUERY);
  const orgs = data?.myOrganizations ?? [];

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h2>
          <p className="text-gray-500 mb-8">Here&apos;s an overview of your workspaces.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{orgs.length}</p>
            </div>
          </div>

          {orgs.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Organizations</h3>
              <div className="grid gap-3">
                {orgs.slice(0, 3).map((org: any) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.id}`}
                    className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      {org.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 text-sm">{org.name}</p>
                      <p className="text-xs text-gray-400">/{org.slug}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {orgs.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-1">Get started</h3>
              <p className="text-gray-500 text-sm mb-4">Create an organization to start managing projects</p>
              <Link
                href="/organizations"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Create Organization
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
