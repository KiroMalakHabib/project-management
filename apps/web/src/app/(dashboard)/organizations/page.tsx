'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { Modal } from '@/components/ui/Modal';
import { MY_ORGANIZATIONS_QUERY } from '@/graphql/queries/organization.queries';
import { CREATE_ORGANIZATION_MUTATION } from '@/graphql/mutations/organization.mutations';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function OrganizationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data, loading, refetch } = useQuery(MY_ORGANIZATIONS_QUERY);
  const [createOrg, { loading: creating }] = useMutation(CREATE_ORGANIZATION_MUTATION);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createOrg({
        variables: { input: { name, slug, description: description || undefined } },
      });
      await refetch();
      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const orgs = data?.myOrganizations ?? [];

  return (
    <>
      <TopBar title="Organizations" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Organizations</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your teams and workspaces</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Organization
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          )}

          {!loading && orgs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No organizations yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create your first organization to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Create Organization
              </button>
            </div>
          )}

          <div className="grid gap-4">
            {orgs.map((org: any) => (
              <Link
                key={org.id}
                href={`/organizations/${org.id}`}
                className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-400">/{org.slug}</p>
                    {org.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{org.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-blue-400 text-xl">›</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              placeholder="What does this organization do?"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
