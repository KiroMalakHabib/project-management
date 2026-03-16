'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { PROJECT_QUERY } from '@/graphql/queries/project.queries';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data, loading } = useQuery(PROJECT_QUERY, { variables: { id: params.id } });
  const project = data?.project;

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;
  if (!project) return <div className="flex-1 flex items-center justify-center text-gray-400">Project not found</div>;

  return (
    <>
      <TopBar title={project.name} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/organizations" className="hover:text-gray-600">Organizations</Link>
            <span>›</span>
            <Link href={`/organizations/${project.organization?.id}`} className="hover:text-gray-600">
              {project.organization?.name}
            </Link>
            <span>›</span>
            <span className="text-gray-700">{project.name}</span>
          </div>

          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h2>
            {project.description && <p className="text-gray-500 mb-4">{project.description}</p>}
            <p className="text-sm text-gray-400">
              Kanban board and task management coming in Phase 3
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
