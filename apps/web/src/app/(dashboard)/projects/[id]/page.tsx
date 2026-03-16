'use client';

import { useQuery, useMutation, useSubscription } from '@apollo/client';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PROJECT_COLUMNS_QUERY } from '@/graphql/queries/task.queries';
import { SEED_DEFAULT_COLUMNS_MUTATION } from '@/graphql/mutations/task.mutations';
import { TASK_EVENTS_SUBSCRIPTION } from '@/graphql/subscriptions/task.subscriptions';
import { PROJECT_QUERY } from '@/graphql/queries/project.queries';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: projectData } = useQuery(PROJECT_QUERY, { variables: { id: params.id } });
  const { data, loading, refetch } = useQuery(PROJECT_COLUMNS_QUERY, {
    variables: { projectId: params.id },
    fetchPolicy: 'cache-and-network',
  });

  const [seedColumns] = useMutation(SEED_DEFAULT_COLUMNS_MUTATION);

  // Real-time task updates
  useSubscription(TASK_EVENTS_SUBSCRIPTION, {
    variables: { projectId: params.id },
    onData: () => refetch(),
  });

  const project = projectData?.project;
  const columns = data?.projectColumns ?? [];
  const hasColumns = columns.length > 0;

  const handleSeedColumns = async () => {
    await seedColumns({ variables: { projectId: params.id } });
    refetch();
  };

  return (
    <>
      <TopBar title={project?.name ?? 'Project'} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/organizations" className="hover:text-gray-600">Organizations</Link>
          <span>›</span>
          {project?.organization && (
            <>
              <Link href={`/organizations/${project.organization.id}`} className="hover:text-gray-600">
                {project.organization.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-700">{project?.name}</span>
        </div>

        {/* Board area */}
        {loading && !data ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading board...</div>
        ) : !hasColumns ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Set up your Kanban board</h2>
              <p className="text-gray-500 mb-6">Start with the default columns or create custom ones</p>
              <button
                onClick={handleSeedColumns}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Create Default Columns
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-6 py-4">
            <KanbanBoard
              columns={columns}
              projectId={params.id}
              onRefresh={refetch}
            />
          </div>
        )}
      </main>
    </>
  );
}
