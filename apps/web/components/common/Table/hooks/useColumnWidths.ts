import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TableColumn } from '../Table.types';
import { loadFromStorage, removeFromStorage, saveToStorage } from '../utils/storage';

type ColumnWidthMap<TId extends string> = Record<TId, number>;

interface UseColumnWidthsParams<TData, TId extends string> {
  columns: TableColumn<TData, TId>[];
  rows: TData[];
  storageKey: string;
  allowHorizontalOverflow: boolean;
  getColumnMinWidth?: (columnId: TId) => number | undefined;
  resizeSensitivity?: number;
}

interface ColumnConstraints {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
}

interface UseColumnWidthsResult<TId extends string> {
  widths: ColumnWidthMap<TId>;
  tableWidth: number;
  minTableWidth: number;
  handleResizeMouseDown: (columnId: TId) => (event: React.MouseEvent<HTMLDivElement>) => void;
  resetAllWidths: () => void;
  resetColumnWidth: (columnId: TId) => void;
}

const DEFAULT_MIN_WIDTH = 0;
const DEFAULT_MAX_WIDTH = 600;
const DEFAULT_COLUMN_WIDTH = 160;
let RESIZE_SENSITIVITY = 1;

interface PersistedWidths<TId extends string> {
  widths: ColumnWidthMap<TId>;
}

export function useColumnWidths<TData, TId extends string>(params: UseColumnWidthsParams<TData, TId>): UseColumnWidthsResult<TId> {
  const { columns, rows, storageKey, allowHorizontalOverflow, getColumnMinWidth, resizeSensitivity } = params;
  RESIZE_SENSITIVITY = resizeSensitivity ?? RESIZE_SENSITIVITY

  const constraintsById = useMemo<Record<TId, ColumnConstraints>>(
    () =>
      columns.reduce(
        (acc, column) => {
          const minWidth = column.minWidth ?? DEFAULT_MIN_WIDTH;
          const maxWidth = column.maxWidth ?? DEFAULT_MAX_WIDTH;
          const defaultWidth = column.defaultWidth ?? DEFAULT_COLUMN_WIDTH;
          const normalizedMin = Math.min(minWidth, maxWidth);
          const normalizedMax = Math.max(minWidth, maxWidth);

          acc[column.id as TId] = {
            minWidth: normalizedMin,
            maxWidth: normalizedMax,
            defaultWidth: Math.min(Math.max(defaultWidth, normalizedMin), normalizedMax),
          };
          return acc;
        },
        {} as Record<TId, ColumnConstraints>
      ),
    [columns]
  );

  const columnOrder = useMemo(() => columns.map((c) => c.id as TId), [columns]);

  const [widths, setWidths] = useState<ColumnWidthMap<TId>>(() => {
    const persisted = loadFromStorage<PersistedWidths<TId>>(`${storageKey}:widths`);
    if (persisted?.widths) {
      return persisted.widths;
    }

    const initial: ColumnWidthMap<TId> = {} as ColumnWidthMap<TId>;
    for (const column of columns) {
      const c = constraintsById[column.id as TId];
      initial[column.id as TId] = c?.defaultWidth ?? DEFAULT_COLUMN_WIDTH;
    }
    return initial;
  });
  const [minTableWidth, setMinTableWidth] = useState(() =>
    columnOrder.reduce((sum, id) => sum + (constraintsById[id]?.minWidth ?? DEFAULT_MIN_WIDTH), 0)
  );

  useEffect(() => {
    setWidths((prev) => {
      const effectiveConstraintsById = buildEffectiveConstraintsById(columnOrder, constraintsById, getColumnMinWidth);
      const normalized: ColumnWidthMap<TId> = {} as ColumnWidthMap<TId>;
      for (const column of columns) {
        const id = column.id as TId;
        const existing = prev[id];
        const constraints = effectiveConstraintsById[id];

        if (!constraints) continue;

        if (typeof existing === 'number') {
          normalized[id] = clampWidth(existing, constraints);
        } else {
          normalized[id] = constraints.defaultWidth;
        }
      }

      if (Object.keys(normalized).length === 0) return prev;

      const same =
        Object.keys(normalized).length === Object.keys(prev).length &&
        Object.entries(normalized).every(([key, value]) => prev[key as TId] === value);
      return same ? prev : normalized;
    });
  }, [columnOrder, columns, constraintsById, getColumnMinWidth, rows]);

  useEffect(() => {
    const effectiveConstraintsById = buildEffectiveConstraintsById(columnOrder, constraintsById, getColumnMinWidth);
    const nextMinTableWidth = columnOrder.reduce(
      (sum, id) => sum + (effectiveConstraintsById[id]?.minWidth ?? DEFAULT_MIN_WIDTH),
      0
    );
    setMinTableWidth(nextMinTableWidth);
  }, [columnOrder, constraintsById, getColumnMinWidth, rows]);

  const resetAllWidths = useCallback(() => {
    const effectiveConstraintsById = buildEffectiveConstraintsById(columnOrder, constraintsById, getColumnMinWidth);
    const next: ColumnWidthMap<TId> = {} as ColumnWidthMap<TId>;
    for (const column of columns) {
      const id = column.id as TId;
      next[id] = effectiveConstraintsById[id]?.defaultWidth ?? DEFAULT_COLUMN_WIDTH;
    }
    setWidths(next);
    removeFromStorage(`${storageKey}:widths`);
  }, [columnOrder, columns, constraintsById, getColumnMinWidth, storageKey]);

  const resetColumnWidth = useCallback(
    (columnId: TId) => {
      setWidths((prev) => {
        const effectiveConstraintsById = buildEffectiveConstraintsById(columnOrder, constraintsById, getColumnMinWidth);
        const constraints = effectiveConstraintsById[columnId];
        if (!constraints) return prev;
        const currentValue = getEffectiveWidth(columnId, prev, effectiveConstraintsById);
        const nextValue = constraints.defaultWidth;
        const delta = nextValue - currentValue;
        if (delta === 0) return prev;

        if (allowHorizontalOverflow) {
          return { ...prev, [columnId]: nextValue };
        }

        const targetIndex = columnOrder.indexOf(columnId);
        if (targetIndex === -1) return prev;

        const next = applyCascadingResize(columnId, delta, prev, columnOrder, effectiveConstraintsById);
        const updatedValue = getEffectiveWidth(columnId, next, effectiveConstraintsById);
        const remaining = nextValue - updatedValue;
        if (remaining === 0) return next;

        if (targetIndex <= 0) return next;

        const leftNeighborId = columnOrder[targetIndex - 1];
        return applyCascadingResize(leftNeighborId, -remaining, next, columnOrder, effectiveConstraintsById);
      });
    },
    [allowHorizontalOverflow, columnOrder, constraintsById, getColumnMinWidth]
  );

  const tableWidth = useMemo(() => Object.values(widths).reduce((sum: number, w) => sum + (typeof w === 'number' ? w : 0), 0), [widths]);

  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{
    columnId: TId;
    lastX: number;
  } | null>(null);
  const pendingDeltaRef = useRef(0);
  const pendingColumnRef = useRef<TId | null>(null);
  const frameRef = useRef<number | null>(null);

  const handleResizeMouseDown = useCallback(
    (columnId: TId) => (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      dragStateRef.current = {
        columnId,
        lastX: event.clientX,
      };
      pendingDeltaRef.current = 0;
      pendingColumnRef.current = columnId;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      setIsDragging(true);
    },
    []
  );

  const applyDelta = useCallback(
    (columnId: TId, deltaX: number) => {
      setWidths((prevWidths) => {
        const effectiveConstraintsById = buildEffectiveConstraintsById(columnOrder, constraintsById, getColumnMinWidth);
        const constraints = effectiveConstraintsById[columnId];
        if (!constraints) return prevWidths;

        if (deltaX < 0) {
          if (!allowHorizontalOverflow) {
            return applyCascadingResize(columnId, deltaX, prevWidths, columnOrder, effectiveConstraintsById);
          }

          return applyOverflowLeftCascadeResize(columnId, deltaX, prevWidths, columnOrder, effectiveConstraintsById);
        }

        if (!allowHorizontalOverflow) {
          return applyCascadingResize(columnId, deltaX, prevWidths, columnOrder, effectiveConstraintsById);
        }

        const currentWidth = prevWidths[columnId] ?? constraints.defaultWidth;
        const nextWidth = clampWidth(currentWidth + deltaX, constraints);

        if (nextWidth === currentWidth) return prevWidths;
        return { ...prevWidths, [columnId]: nextWidth };
      });
    },
    [allowHorizontalOverflow, columnOrder, constraintsById, getColumnMinWidth]
  );

  const flushPendingResize = useCallback(() => {
    const pendingColumn = pendingColumnRef.current;
    const pendingDelta = pendingDeltaRef.current;
    if (pendingColumn == null || pendingDelta === 0) return;

    pendingDeltaRef.current = 0;
    applyDelta(pendingColumn, pendingDelta);
  }, [applyDelta]);

  const queueResizeDelta = useCallback(
    (columnId: TId, deltaX: number) => {
      pendingColumnRef.current = columnId;
      pendingDeltaRef.current += deltaX;

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        flushPendingResize();
      });
    },
    [flushPendingResize]
  );

  const handleMouseUp = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    flushPendingResize();
    pendingColumnRef.current = null;

    dragStateRef.current = null;
    setIsDragging(false);

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [flushPendingResize]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      if (event.buttons === 0) {
        handleMouseUp();
        return;
      }

      const { columnId, lastX } = dragState;
      const deltaX = event.clientX - lastX;
      if (deltaX === 0) return;

      dragState.lastX = event.clientX;
      const adjustedDelta = Math.round(deltaX * RESIZE_SENSITIVITY);
      if (adjustedDelta === 0) return;
      queueResizeDelta(columnId, adjustedDelta);
    },
    [handleMouseUp, queueResizeDelta]
  );

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  useEffect(() => {
    if (isDragging) return;
    saveToStorage<PersistedWidths<TId>>(`${storageKey}:widths`, { widths });
  }, [isDragging, storageKey, widths]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    },
    []
  );

  return {
    widths,
    tableWidth,
    minTableWidth,
    handleResizeMouseDown,
    resetAllWidths,
    resetColumnWidth,
  };
}

function clampWidth(width: number, constraints: ColumnConstraints): number {
  return Math.min(Math.max(width, constraints.minWidth), constraints.maxWidth);
}

function buildEffectiveConstraintsById<TId extends string>(
  columnOrder: TId[],
  constraintsById: Record<TId, ColumnConstraints>,
  getColumnMinWidth?: (columnId: TId) => number | undefined
): Record<TId, ColumnConstraints> {
  if (!getColumnMinWidth) return constraintsById;

  let hasOverride = false;
  const next = {} as Record<TId, ColumnConstraints>;

  for (const id of columnOrder) {
    const base = constraintsById[id];
    if (!base) continue;

    const dynamicMinWidth = getColumnMinWidth(id);
    if (typeof dynamicMinWidth !== 'number' || Number.isNaN(dynamicMinWidth)) {
      next[id] = base;
      continue;
    }

    const normalizedMinWidth = Math.min(Math.max(dynamicMinWidth, 0), base.maxWidth);
    if (normalizedMinWidth === base.minWidth) {
      next[id] = base;
      continue;
    }

    hasOverride = true;
    next[id] = {
      minWidth: normalizedMinWidth,
      maxWidth: base.maxWidth,
      defaultWidth: Math.min(Math.max(base.defaultWidth, normalizedMinWidth), base.maxWidth),
    };
  }

  return hasOverride ? next : constraintsById;
}

function getEffectiveWidth<TId extends string>(
  columnId: TId,
  widths: ColumnWidthMap<TId>,
  constraintsById: Record<TId, ColumnConstraints>
): number {
  const constraints = constraintsById[columnId];
  if (!constraints) return widths[columnId] ?? DEFAULT_COLUMN_WIDTH;
  return widths[columnId] ?? constraints.defaultWidth;
}

function applyCascadingResize<TId extends string>(
  targetId: TId,
  deltaX: number,
  widths: ColumnWidthMap<TId>,
  columnOrder: TId[],
  constraintsById: Record<TId, ColumnConstraints>
): ColumnWidthMap<TId> {
  if (deltaX === 0) return widths;

  const targetIndex = columnOrder.indexOf(targetId);
  if (targetIndex === -1) return widths;

  const leftGroup = columnOrder.slice(0, targetIndex + 1);
  const rightGroup = columnOrder.slice(targetIndex + 1);

  // In the UI, the resize handle is rendered on the *right edge* of `targetId`,
  // i.e. between `targetId` and the column immediately to its right.
  // For non-overflow tables, moving that divider transfers width between:
  // - left side (all columns up to and including `targetId`)
  // - right side (all columns to the right of `targetId`)
  if (leftGroup.length === 0 || rightGroup.length === 0) return widths;

  const leftOrder = [...leftGroup].reverse(); // start at target, then go leftwards
  const rightOrder = rightGroup; // start adjacent to target, then go rightwards

  const next = { ...widths };

  const getCurrent = (id: TId): number => {
    const c = constraintsById[id];
    if (!c) return widths[id] ?? DEFAULT_COLUMN_WIDTH;
    return widths[id] ?? c.defaultWidth;
  };

  if (deltaX < 0) {
    // Divider moves left: left side must shrink; right side must grow.
    const desired = -deltaX;

    let availableLeftShrink = 0;
    for (const id of leftOrder) {
      const c = constraintsById[id];
      if (!c) continue;
      const current = getCurrent(id);
      availableLeftShrink += Math.max(0, current - c.minWidth);
    }

    let availableRightGrow = 0;
    for (const id of rightOrder) {
      const c = constraintsById[id];
      if (!c) continue;
      const current = getCurrent(id);
      availableRightGrow += Math.max(0, c.maxWidth - current);
    }

    const applied = Math.min(desired, availableLeftShrink, availableRightGrow);
    if (applied === 0) return widths;

    // cascade apply shrinking to the cells on the left
    let remaining = applied;
    for (const id of leftOrder) {
      if (remaining === 0) break;
      const c = constraintsById[id];
      if (!c) continue;
      const current = getCurrent(id);
      const canShrink = Math.max(0, current - c.minWidth);
      const shrinkBy = Math.min(remaining, canShrink);
      if (shrinkBy !== 0) {
        next[id] = current - shrinkBy;
        remaining -= shrinkBy;
      }
    }

    // Comepensate by growing the cells to the right
    remaining = applied;
    for (const id of rightOrder) {
      if (remaining === 0) break;
      const c = constraintsById[id];
      if (!c) continue;
      const current = getCurrent(id);
      const canGrow = Math.max(0, c.maxWidth - current);
      const growBy = Math.min(remaining, canGrow);
      if (growBy !== 0) {
        next[id] = current + growBy;
        remaining -= growBy;
      }
    }

    return next;
  }

  // deltaX > 0
  // Divider moves right: left side must grow; right side must shrink.
  const desired = deltaX;

  let availableLeftGrow = 0;
  for (const id of leftOrder) {
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    availableLeftGrow += Math.max(0, c.maxWidth - current);
  }

  let availableRightShrink = 0;
  for (const id of rightOrder) {
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    availableRightShrink += Math.max(0, current - c.minWidth);
  }

  const applied = Math.min(desired, availableLeftGrow, availableRightShrink);
  if (applied === 0) return widths;

  let remaining = applied;
  for (const id of leftOrder) {
    if (remaining === 0) break;
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    const canGrow = Math.max(0, c.maxWidth - current);
    const growBy = Math.min(remaining, canGrow);
    if (growBy !== 0) {
      next[id] = current + growBy;
      remaining -= growBy;
    }
  }

  remaining = applied;
  for (const id of rightOrder) {
    if (remaining === 0) break;
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    const canShrink = Math.max(0, current - c.minWidth);
    const shrinkBy = Math.min(remaining, canShrink);
    if (shrinkBy !== 0) {
      next[id] = current - shrinkBy;
      remaining -= shrinkBy;
    }
  }

  return next;
}

function applyOverflowLeftCascadeResize<TId extends string>(
  targetId: TId,
  deltaX: number,
  widths: ColumnWidthMap<TId>,
  columnOrder: TId[],
  constraintsById: Record<TId, ColumnConstraints>
): ColumnWidthMap<TId> {
  if (deltaX >= 0) return widths;

  const targetIndex = columnOrder.indexOf(targetId);
  if (targetIndex === -1) return widths;

  const leftOrder = columnOrder.slice(0, targetIndex + 1).reverse();
  if (leftOrder.length === 0) return widths;

  const next = { ...widths };

  const getCurrent = (id: TId): number => {
    const c = constraintsById[id];
    if (!c) return widths[id] ?? DEFAULT_COLUMN_WIDTH;
    return widths[id] ?? c.defaultWidth;
  };

  const desired = -deltaX;

  let availableShrink = 0;
  for (const id of leftOrder) {
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    availableShrink += Math.max(0, current - c.minWidth);
  }

  const applied = Math.min(desired, availableShrink);
  if (applied === 0) return widths;

  let remaining = applied;
  for (const id of leftOrder) {
    if (remaining === 0) break;
    const c = constraintsById[id];
    if (!c) continue;
    const current = getCurrent(id);
    const canShrink = Math.max(0, current - c.minWidth);
    const shrinkBy = Math.min(remaining, canShrink);
    if (shrinkBy !== 0) {
      next[id] = current - shrinkBy;
      remaining -= shrinkBy;
    }
  }

  return next;
}
