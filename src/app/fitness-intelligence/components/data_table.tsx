'use client';

import { useMemo, useState, type ReactNode } from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Value used for sorting this column. Defaults to non-sortable if omitted. */
  sortValue?: (row: T) => number | string;
  render: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  /** Text searched against the query box. Omit to hide search. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  maxHeight?: string;
  caption?: ReactNode;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`inline-block ml-1 transition-opacity ${dir ? 'opacity-100' : 'opacity-30'}`}
    >
      {dir === 'asc' ? (
        <path d="M7 14l5-5 5 5z" />
      ) : dir === 'desc' ? (
        <path d="M7 10l5 5 5-5z" />
      ) : (
        <path d="M7 10l5-5 5 5H7zm0 4h10l-5 5-5-5z" />
      )}
    </svg>
  );
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = 'Search…',
  initialSort,
  maxHeight = '500px',
  caption,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(initialSort ?? null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchText || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [data, searchText, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [filtered, sort, columns]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return null;
    });
  };

  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div>
      {searchText && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          {query && (
            <span className="whitespace-nowrap text-xs text-gray-500">
              {sorted.length} of {data.length}
            </span>
          )}
        </div>
      )}
      <div className="overflow-x-auto overflow-y-auto rounded-lg" style={{ maxHeight }}>
        <table className="w-full min-w-[600px] text-sm">
          <thead className="sticky top-0 z-10 bg-brand-primary/5 backdrop-blur">
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`p-3 font-semibold text-brand-primary ${alignClass(col.align)} ${col.headerClassName ?? ''} ${col.sortable ? 'cursor-pointer select-none hover:text-brand-primary-dark' : ''}`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.header}
                    {col.sortable && <SortIcon dir={active ? sort!.dir : null} />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={rowKey(row)}
                className="border-b border-gray-100 transition-colors hover:bg-brand-secondary"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`p-3 ${alignClass(col.align)} ${col.cellClassName ?? ''}`}>
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-gray-400">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {caption && <p className="mt-4 text-sm text-gray-500">{caption}</p>}
    </div>
  );
}
