import React from 'react';
import { cn } from '@/lib/utils';

type Column = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render?: (row: any) => React.ReactNode;
};

type DataTableProps = {
  columns: Column[];
  rows: any[];
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="rounded-2xl border border-[--line] overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[var(--panel)]/80 backdrop-blur-sm">
          <tr className="text-[--text-dim]">
            {columns.map(c => (
              <th key={c.key} className={cn(
                "px-4 py-3 border-b border-[--line] font-semibold",
                c.align === "right" ? "text-right" : "text-left"
              )}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[--line]">
          {rows.map((r, i) => (
            <tr key={r.id || i} className="hover:bg-[--muted]/50">
              {columns.map(c => (
                <td key={c.key} className={cn(
                  "px-4 py-3 whitespace-nowrap",
                  c.align === "right" ? "text-right" : ""
                )}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
