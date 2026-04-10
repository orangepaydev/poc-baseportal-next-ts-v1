'use client';

import { useDeferredValue, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type {
  AvailableUserOption,
  ManagedUserGroupMembership,
} from '@/lib/user-group-memberships';

type UserGroupMembershipEditorProps = {
  existingMembers: ManagedUserGroupMembership[];
  availableUsers: AvailableUserOption[];
};

export function UserGroupMembershipEditor({
  existingMembers,
  availableUsers,
}: UserGroupMembershipEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<AvailableUserOption[]>([]);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const selectedIds = new Set(selectedToAdd.map((user) => user.userId));
  const filteredUsers = availableUsers.filter((user) => {
    if (selectedIds.has(user.userId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      user.username,
      user.displayName,
      user.email ?? '',
      user.status,
      user.userType,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  function addUser(user: AvailableUserOption) {
    setSelectedToAdd((current) => [...current, user]);
  }

  function removeSelectedUser(userId: number) {
    setSelectedToAdd((current) => current.filter((user) => user.userId !== userId));
  }

  return (
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-[24px] border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Remove
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  User Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Display Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {existingMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                    No users are currently assigned to this user group.
                  </td>
                </tr>
              ) : null}

              {existingMembers.map((member) => (
                <tr key={member.userId}>
                  <td className="px-4 py-4 align-top">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        name="removeUserIds"
                        type="checkbox"
                        value={member.userId}
                        className="size-4 rounded border-slate-300 text-slate-950"
                      />
                      Remove
                    </label>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {member.username}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {member.displayName}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {member.email ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Add Users</h3>
            <p className="mt-1 text-sm text-slate-600">
              Newly selected users will be assigned only after the update request is approved.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add user
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Selected User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Display Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Remove
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {selectedToAdd.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                      No new users have been selected.
                    </td>
                  </tr>
                ) : null}

                {selectedToAdd.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {user.username}
                      <input name="addUserIds" type="hidden" value={user.userId} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {user.displayName}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {user.email ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => removeSelectedUser(user.userId)}
                      >
                        <X className="size-4" />
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
                User Search
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Add users to the request
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search the approved users in this organization and select users to add to this user group.
              </p>
            </div>

            <div className="px-6 py-5">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Search user</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:bg-white">
                  <Search className="size-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by user name, display name, email, or status"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  />
                </div>
              </label>

              <div className="mt-5 max-h-[48vh] overflow-hidden rounded-[24px] border border-slate-200">
                <div className="overflow-x-auto overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          User Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Display Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Add
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            No matching users are available.
                          </td>
                        </tr>
                      ) : null}

                      {filteredUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            {user.username}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.displayName}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.email ?? '—'}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {user.status}
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              onClick={() => addUser(user)}
                            >
                              <Plus className="size-4" />
                              Add
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}