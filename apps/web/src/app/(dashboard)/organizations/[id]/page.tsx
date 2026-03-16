'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ORGANIZATION_QUERY, ORGANIZATION_MEMBERS_QUERY } from '@/graphql/queries/organization.queries';
import { INVITE_MEMBER_MUTATION } from '@/graphql/mutations/organization.mutations';
import { PROJECTS_QUERY } from '@/graphql/queries/project.queries';
import { CREATE_PROJECT_MUTATION } from '@/graphql/mutations/project.mutations';
import { useAuthStore } from '@/stores/auth.store';

const roleBadgeVariant: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  OWNER: 'blue',
  ADMIN: 'green',
  MEMBER: 'gray',
  VIEWER: 'gray',
};

export default function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectError, setProjectError] = useState('');

  const { data: orgData } = useQuery(ORGANIZATION_QUERY, { variables: { id: params.id } });
  const { data: membersData, refetch: refetchMembers } = useQuery(ORGANIZATION_MEMBERS_QUERY, {
    variables: { organizationId: params.id },
  });
  const { data: projectsData, refetch: refetchProjects } = useQuery(PROJECTS_QUERY, {
    variables: { organizationId: params.id },
  });

  const [inviteMember, { loading: inviting }] = useMutation(INVITE_MEMBER_MUTATION);
  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT_MUTATION);

  const org = orgData?.organization;
  const members = membersData?.organizationMembers ?? [];
  const projects = projectsData?.projects ?? [];

  const myMembership = members.find((m: any) => m.user.id === user?.id);
  const canInvite = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    try {
      await inviteMember({
        variables: { organizationId: params.id, input: { email: inviteEmail, role: inviteRole } },
      });
      await refetchMembers();
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.message);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError('');
    try {
      await createProject({
        variables: {
          input: { organizationId: params.id, name: projectName, description: projectDesc || undefined },
        },
      });
      await refetchProjects();
      setShowProjectModal(false);
      setProjectName('');
      setProjectDesc('');
    } catch (err: any) {
      setProjectError(err.message);
    }
  };

  if (!org) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <>
      <TopBar title={org.name} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                {org.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{org.name}</h2>
                <p className="text-gray-400 text-sm">/{org.slug}</p>
                {org.description && <p className="text-gray-600 text-sm mt-0.5">{org.description}</p>}
              </div>
            </div>
            {canInvite && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Invite Member
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b">
            {(['projects', 'members'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'projects' ? `(${projects.length})` : `(${members.length})`}
              </button>
            ))}
          </div>

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  + New Project
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="font-medium text-gray-900 mb-1">No projects yet</h3>
                  <p className="text-sm text-gray-500">Create your first project to start managing tasks</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {projects.map((project: any) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                      <Badge label={project.status} variant={project.status === 'ACTIVE' ? 'green' : 'gray'} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-xl border divide-y">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.user.fullName} avatarUrl={member.user.avatarUrl} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.user.fullName}</p>
                      <p className="text-xs text-gray-400">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge
                    label={member.role}
                    variant={roleBadgeVariant[member.role] || 'gray'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member">
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{inviteError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="colleague@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={inviting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Create Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          {projectError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{projectError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My awesome project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowProjectModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={creatingProject} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creatingProject ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
