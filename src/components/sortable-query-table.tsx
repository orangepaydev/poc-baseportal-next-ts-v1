'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc';
type CellAlign = 'left' | 'center' | 'right';
type CellTone = 'neutral' | 'success' | 'warning' | 'danger';

type SortableQueryTableCellBase = {
  primary: string | number;
  secondary?: string;
  sortValue?: string | number | null;
  align?: CellAlign;
};

export type SortableQueryTableCell =
  | (SortableQueryTableCellBase & {
      kind: 'text';
    })
  | (SortableQueryTableCellBase & {
      kind: 'link';
      href: string;
    })
  | (SortableQueryTableCellBase & {
      kind: 'badge';
      tone?: CellTone;
    });

export type SortableQueryTableColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  align?: CellAlign;
};

export type SortableQueryTableRow = {
  id: string | number;
  cells: Record<string, SortableQueryTableCell>;
};

type SortableQueryTableProps = {
  columns: readonly SortableQueryTableColumn[];
  rows: readonly SortableQueryTableRow[];
  emptyMessage: string;
};

const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

const alignmentClassNames: Record<CellAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const badgeToneClassNames: Record<CellTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

function compareValues(
  left: string | number | null | undefined,
  right: string | number | null | undefined
) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return collator.compare(String(left ?? ''), String(right ?? ''));
}

function getCellSortValue(cell: SortableQueryTableCell) {
  return cell.sortValue ?? cell.primary;
}

function getAlignmentClassName(
  cellAlign?: CellAlign,
  columnAlign?: CellAlign
) {
  return alignmentClassNames[cellAlign ?? columnAlign ?? 'left'];
}

function renderCell(cell: SortableQueryTableCell, columnAlign?: CellAlign) {
  const alignmentClassName = getAlignmentClassName(cell.align, columnAlign);

  if (cell.kind === 'link') {
    return (
      <div className={alignmentClassName}>
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link href={cell.href}>{cell.primary}</Link>
        </Button>
        {cell.secondary ? (
          <p className="mt-1 text-sm text-slate-500">{cell.secondary}</p>
        ) : null}
      </div>
    );
  }

  if (cell.kind === 'badge') {
    return (
      <div className={alignmentClassName}>
        <div
          className={cn(
            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
            badgeToneClassNames[cell.tone ?? 'neutral']
          )}
        >
          {cell.primary}
        </div>
        {cell.secondary ? (
          <p className="mt-1 text-sm text-slate-500">{cell.secondary}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={alignmentClassName}>
      <p className="text-sm text-slate-700">{cell.primary}</p>
      {cell.secondary ? (
        <p className="mt-1 text-sm text-slate-500">{cell.secondary}</p>
      ) : null}
    </div>
  );
}

export function SortableQueryTable({
  columns,
  rows,
  emptyMessage,
}: SortableQueryTableProps) {
  const [sortState, setSortState] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);

  const sortedRows =
    sortState === null
      ? rows
      : rows
          .map((row, index) => ({ row, index }))
          .sort((left, right) => {
            const leftCell = left.row.cells[sortState.key];
            const rightCell = right.row.cells[sortState.key];
            const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;
            const result = compareValues(
              leftCell ? getCellSortValue(leftCell) : null,
              rightCell ? getCellSortValue(rightCell) : null
            );

            if (result !== 0) {
              return result * directionMultiplier;
            }

            return left.index - right.index;
          })
          .map(({ row }) => row);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => {
              const isActive = sortState?.key === column.key;

              return (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase',
                    alignmentClassNames[column.align ?? 'left']
                  )}
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSortState((currentState) => {
                          if (currentState?.key !== column.key) {
                            return { key: column.key, direction: 'asc' };
                          }

                          return {
                            key: column.key,
                            direction:
                              currentState.direction === 'asc' ? 'desc' : 'asc',
                          };
                        });
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md text-inherit transition hover:text-slate-700',
                        column.align === 'right' ? 'ml-auto' : null,
                        column.align === 'center' ? 'mx-auto' : null
                      )}
                    >
                      <span>{column.label}</span>
                      {isActive ? (
                        sortState?.direction === 'asc' ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )
                      ) : (
                        <ArrowUpDown className="size-4" />
                      )}
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}

          {sortedRows.map((row) => (
            <tr key={row.id} className="align-top">
              {columns.map((column) => {
                const cell = row.cells[column.key];

                return (
                  <td key={column.key} className="px-4 py-4">
                    {cell ? renderCell(cell, column.align) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
