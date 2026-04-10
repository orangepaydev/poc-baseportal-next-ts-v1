'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ManagedSystemCodeValue } from '@/lib/system-codes';

type NewValueRow = {
  key: number;
  systemCodeValue: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
};

type SystemCodeValuesEditorProps = {
  existingValues: ManagedSystemCodeValue[];
};

function createEmptyRow(key: number): NewValueRow {
  return {
    key,
    systemCodeValue: '',
    description: '',
    status: 'ACTIVE',
    sortOrder: 0,
  };
}

export function SystemCodeValuesEditor({
  existingValues,
}: SystemCodeValuesEditorProps) {
  const [newRows, setNewRows] = useState<NewValueRow[]>([createEmptyRow(1)]);

  function addRow() {
    setNewRows((current) => [
      ...current,
      createEmptyRow(current.length === 0 ? 1 : current[current.length - 1].key + 1),
    ]);
  }

  function removeRow(rowKey: number) {
    setNewRows((current) => {
      const remaining = current.filter((row) => row.key !== rowKey);
      return remaining.length > 0 ? remaining : [createEmptyRow(rowKey + 1)];
    });
  }

  function updateRow(
    rowKey: number,
    field: keyof Omit<NewValueRow, 'key'>,
    value: string | number
  ) {
    setNewRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
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
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  Sort Order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {existingValues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">
                    No System Code Values exist yet.
                  </td>
                </tr>
              ) : null}

              {existingValues.map((value) => (
                <tr key={value.id}>
                  <td className="px-4 py-4 align-top">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        name="removeValueIds"
                        type="checkbox"
                        value={value.id}
                        className="size-4 rounded border-slate-300 text-slate-950"
                      />
                      Remove
                    </label>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {value.systemCodeValue}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {value.description}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {value.status}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {value.sortOrder}
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
            <h3 className="text-sm font-semibold text-slate-950">Add System Code Values</h3>
            <p className="mt-1 text-sm text-slate-600">
              New rows in this section will be added only after the update request is approved.
            </p>
          </div>

          <Button type="button" variant="outline" className="rounded-2xl" onClick={addRow}>
            <Plus className="size-4" />
            Add value row
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {newRows.map((row) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.2fr_2fr_0.9fr_0.7fr_auto]"
            >
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Value</span>
                <input
                  name="newValueCode"
                  type="text"
                  value={row.systemCodeValue}
                  onChange={(event) =>
                    updateRow(row.key, 'systemCodeValue', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Description</span>
                <input
                  name="newValueDescription"
                  type="text"
                  value={row.description}
                  onChange={(event) =>
                    updateRow(row.key, 'description', event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Status</span>
                <select
                  name="newValueStatus"
                  value={row.status}
                  onChange={(event) =>
                    updateRow(
                      row.key,
                      'status',
                      event.target.value as 'ACTIVE' | 'INACTIVE'
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Sort Order</span>
                <input
                  name="newValueSortOrder"
                  type="number"
                  min={0}
                  step={1}
                  value={row.sortOrder}
                  onChange={(event) =>
                    updateRow(row.key, 'sortOrder', Number(event.target.value || 0))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 className="size-4" />
                  Remove row
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}