'use client';

import { useDeferredValue, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type {
  AvailablePermissionOption,
  ManagedPermissionAssignment,
} from '@/lib/user-group-permissions';

type UserGroupPermissionEditorProps = {
  existingPermissions: ManagedPermissionAssignment[];
  availablePermissions: AvailablePermissionOption[];
};

export function UserGroupPermissionEditor({
  existingPermissions,
  availablePermissions,
}: UserGroupPermissionEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<AvailablePermissionOption[]>([]);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const selectedIds = new Set(
    selectedToAdd.map((permission) => permission.permissionId)
  );
  const filteredPermissions = availablePermissions.filter((permission) => {
    if (selectedIds.has(permission.permissionId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      permission.permissionCode,
      permission.permissionName,
      permission.actionCode,
      permission.resourceCode,
      permission.description ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  function addPermission(permission: AvailablePermissionOption) {
    setSelectedToAdd((current) => [...current, permission]);
  }

  function removeSelectedPermission(permissionId: number) {
    setSelectedToAdd((current) =>
      current.filter((permission) => permission.permissionId !== permissionId)
    );
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
                  Permission Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {existingPermissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                    No permissions are currently assigned to this user group.
                  </td>
                </tr>
              ) : null}

              {existingPermissions.map((permission) => (
                <tr key={permission.permissionId}>
                  <td className="px-4 py-4 align-top">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        name="removePermissionIds"
                        type="checkbox"
                        value={permission.permissionId}
                        className="size-4 rounded border-slate-300 text-slate-950"
                      />
                      Remove
                    </label>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {permission.permissionCode}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {permission.actionCode}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {permission.description ?? '—'}
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
            <h3 className="text-sm font-semibold text-slate-950">
              Add Permissions
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Newly selected permissions will be assigned only after the update request is approved.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add permission
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Selected Permission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Description
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
                      No new permissions have been selected.
                    </td>
                  </tr>
                ) : null}

                {selectedToAdd.map((permission) => (
                  <tr key={permission.permissionId}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {permission.permissionCode}
                      <input
                        name="addPermissionIds"
                        type="hidden"
                        value={permission.permissionId}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {permission.actionCode}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {permission.description ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => removeSelectedPermission(permission.permissionId)}
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
                Permission Search
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Add permissions to the request
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search the permission catalog and select permissions to add to this user group.
              </p>
            </div>

            <div className="px-6 py-5">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Search permission</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:bg-white">
                  <Search className="size-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by permission code, action, resource, or description"
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
                          Permission Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Resource
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                          Add
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredPermissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-sm text-slate-500"
                          >
                            No matching permissions are available.
                          </td>
                        </tr>
                      ) : null}

                      {filteredPermissions.map((permission) => (
                        <tr key={permission.permissionId}>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            {permission.permissionCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {permission.actionCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {permission.resourceCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {permission.description ?? '—'}
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              onClick={() => addPermission(permission)}
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