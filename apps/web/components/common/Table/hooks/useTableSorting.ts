import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TableColumn, TableSortingState } from '../index';
import { loadFromStorage, removeFromStorage, saveToStorage } from '../utils/storage';

type SortDirection = TableSortingState['direction'];

interface UseTableSortingParams<TData, TId extends string> {
  data: TData[];
  columns: TableColumn<TData, TId>[];
  storageKey: string;
  initialSortState?: TableSortingState<TId>;
  onSortChange?: (state: TableSortingState<TId>) => void;
}

interface UseTableSortingResult<TData, TId extends string> {
  sortedRows: TData[];
  sortState: TableSortingState<TId>;
  toggleSort: (columnId: TId) => void;
  resetSorting: () => void;
}

interface PersistedSortState<TId extends string> {
  state: TableSortingState<TId>;
}

export function useTableSorting<TData, TId extends string>(
  params: UseTableSortingParams<TData, TId>,
): UseTableSortingResult<TData, TId> {
  const { data, columns, storageKey, initialSortState, onSortChange } = params;

  const [sortState, setSortState] = useState<TableSortingState<TId>>(() => {
    const persisted = loadFromStorage<PersistedSortState<TId>>(`${storageKey}:sort`);
    if (persisted?.state) {
      return persisted.state;
    }
    return initialSortState ?? { columnId: null, direction: 'none' };
  });

  useEffect(() => {
    if (
      sortState.columnId &&
      !columns.some((column) => (column.id as TId) === sortState.columnId)
    ) {
      setSortState({ columnId: null, direction: 'none' });
      removeFromStorage(`${storageKey}:sort`);
    }
  }, [columns, sortState, storageKey]);

  useEffect(() => {
    saveToStorage<PersistedSortState<TId>>(`${storageKey}:sort`, { state: sortState });
  }, [sortState, storageKey]);

  const cycleDirection = useCallback((current: SortDirection): SortDirection => {
    if (current === 'none') return 'asc';
    if (current === 'asc') return 'desc';
    return 'none';
  }, []);

  const toggleSort = useCallback(
    (columnId: TId) => {
      const column = columns.find((c) => (c.id as TId) === columnId);
      if (!column?.sortable) return;

      setSortState((prev: TableSortingState<TId>) => {
        const nextDirection =
          prev.columnId === columnId ? cycleDirection(prev.direction) : 'asc';
        const next: TableSortingState<TId> = {
          columnId: nextDirection === 'none' ? null : columnId,
          direction: nextDirection,
        };
        onSortChange?.(next);
        return next;
      });
    },
    [columns, cycleDirection, onSortChange],
  );

  const resetSorting = useCallback(() => {
    const base = initialSortState ?? { columnId: null, direction: 'none' as const };
    setSortState(base);
    removeFromStorage(`${storageKey}:sort`);
    onSortChange?.(base);
  }, [initialSortState, onSortChange, storageKey]);

  const sortedRows = useMemo(() => {
    const { columnId, direction } = sortState;
    if (!columnId || direction === 'none') return data;

    const columnIndex = columns.findIndex((c) => (c.id as TId) === columnId);
    if (columnIndex === -1) return data;

    const base = data.map((item, index) => ({ item, index }));

    base.sort((a, b) => {
      const lhs = a.item as unknown as Record<string, unknown>;
      const rhs = b.item as unknown as Record<string, unknown>;
      const key = columns[columnIndex]?.id as string;

      const av = lhs[key];
      const bv = rhs[key];

      const result = compareValues(av, bv);
      if (result !== 0) {
        return direction === 'asc' ? result : -result;
      }
      return a.index - b.index;
    });

    return base.map((entry) => entry.item);
  }, [columns, data, sortState]);

  return {
    sortedRows,
    sortState,
    toggleSort,
    resetSorting,
  };
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  if (as < bs) return -1;
  if (as > bs) return 1;
  return 0;
}
