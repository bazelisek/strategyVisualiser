"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type JSX,
} from "react";
import TableMui from "@mui/material/Table";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type {
  TableColumn,
  TableRef as TableHandle,
  TableProps,
  TableResetSpacingButtonPosition,
  TableSlotPropFactory,
} from "./Table.types";
import { useColumnWidths } from "./hooks/useColumnWidths";
import { useTableSorting } from "./hooks/useTableSorting";
import TableSortLabel from "@mui/material/TableSortLabel";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import TableRow from "@mui/material/TableRow";
import TableFooter from "@mui/material/TableFooter";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TableContainer from "@mui/material/TableContainer";
import { type Theme, type SxProps } from "@mui/material/styles";
import materialTheme from "@/theme/materialTheme";

function BaseTable<TData, TColumnId extends string = string>(
  props: TableProps<TData, TColumnId>,
  ref: React.Ref<TableHandle>,
) {
  const {
    storageKey: storageKeyProp,
    columns,
    rows,
    resizable = true,
    allowHorizontalOverflow = false,
    initialSortState,
    renderFooter,
    onSortChange,
    slots,
    slotProps,
    resetSpacingButtonPosition,
    resizeSensitivity,
  } = props;

  const reactId = useId();
  const storageKey = storageKeyProp?.trim()
    ? storageKeyProp
    : `IstemUI-Table-${reactId}`;
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const autoMinWidthCacheRef = useRef<Map<TColumnId, number>>(new Map());

  const explicitMinWidthById = useMemo(
    () => new Map(columns.map((col) => [col.id as TColumnId, col.minWidth])),
    [columns],
  );

  useEffect(() => {
    autoMinWidthCacheRef.current.clear();
  }, [columns, rows]);

  const getColumnMinWidth = useCallback(
    (columnId: TColumnId): number | undefined => {
      const configuredMinWidth = explicitMinWidthById.get(columnId);
      if (typeof configuredMinWidth === "number") return configuredMinWidth;

      const cachedMinWidth = autoMinWidthCacheRef.current.get(columnId);
      if (typeof cachedMinWidth === "number") return cachedMinWidth;

      const scrollViewport = scrollViewportRef.current;
      if (!scrollViewport) return undefined;

      const escapedColumnId =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(columnId)
          : columnId;
      const cells = scrollViewport.querySelectorAll<HTMLElement>(
        `[data-column-id="${escapedColumnId}"]`,
      );
      if (cells.length === 0) return undefined;

      // OPTIMIZATION: Create and append the probe strictly once per column measurement
      const probe = document.createElement("span");
      probe.style.position = "absolute";
      probe.style.left = "-100000px";
      probe.style.top = "0";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.whiteSpace = "nowrap";
      document.body.appendChild(probe);

      let measuredMinWidth = 0;
      for (const cell of cells) {
        measuredMinWidth = Math.max(
          measuredMinWidth,
          measureCellBreakSafeMinWidth(cell, probe),
        );
      }

      probe.remove();

      if (measuredMinWidth > 0) {
        autoMinWidthCacheRef.current.set(columnId, measuredMinWidth);
        return measuredMinWidth;
      }

      return undefined;
    },
    [explicitMinWidthById],
  );

  const {
    widths,
    tableWidth,
    minTableWidth,
    handleResizeMouseDown,
    resetAllWidths,
    resetColumnWidth,
  } = useColumnWidths<TData, TColumnId>({
    columns,
    rows,
    storageKey,
    allowHorizontalOverflow,
    getColumnMinWidth,
    resizeSensitivity,
  });

  const { sortedRows, sortState, toggleSort, resetSorting } = useTableSorting<
    TData,
    TColumnId
  >({
    data: rows,
    columns,
    storageKey,
    initialSortState,
    onSortChange,
  });

  useImperativeHandle(
    ref,
    () => ({
      resetColumnWidths: resetAllWidths,
      resetSorting,
    }),
    [resetAllWidths, resetSorting],
  );

  const renderHeaderCell = (
    column: TableColumn<TData, TColumnId>,
    columnIndex: number,
  ) => {
    const width = widths[column.id as TColumnId];
    const isSorted = sortState.columnId === column.id;
    const isLastColumn = columnIndex === columns.length - 1;

    const headerCellContext = { column, columnIndex };
    const headerCellSlotProps = resolveProps(
      slotProps?.headerCell,
      headerCellContext,
    );
    const columnHeaderCellProps = resolveProps(
      column.slotProps?.headerCell,
      headerCellContext,
    );
    const mergedProps = { ...headerCellSlotProps, ...columnHeaderCellProps };
    const totalWidth = tableWidth > 0 ? tableWidth : columns.length || 1;
    const widthPercent = `${(Math.max(width, 0) / totalWidth) * 100}%`;
    const columnSizeStyles = allowHorizontalOverflow
      ? { width, maxWidth: width, minWidth: width }
      : { width: widthPercent, maxWidth: widthPercent, minWidth: 0 };

    const propsForSlot = {
      ...mergedProps,
      "data-column-id": column.id,
      sx: (theme: Theme) => ({
        ...columnSizeStyles,
        overflow: "hidden",
        position: "relative",
        whiteSpace: "normal",
        wordBreak: "normal",
        overflowWrap: "normal",
        userSelect: "none",
        "& .IstemTable-resizeHandle": {
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: 10,
          cursor: "col-resize",
          userSelect: "none",
          zIndex: 2,
        },
        "& .IstemTable-resizeHandle::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: "1px",
          transform: "translateX(-0.5px)",
          backgroundColor: theme.palette.divider,
          opacity: 0.5,
        },
        "&:hover .IstemTable-resizeHandle::after": {
          opacity: 1,
        },
        ...mergeSx(theme, headerCellSlotProps.sx, columnHeaderCellProps.sx),
      }),
      children: (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {column.sortable ? (
              <TableSortLabel
                active={isSorted}
                direction={
                  isSorted && sortState.direction !== "none"
                    ? sortState.direction
                    : "asc"
                }
                onClick={() => toggleSort(column.id as TColumnId)}
              >
                {column.header}
              </TableSortLabel>
            ) : (
              column.header
            )}
          </div>
          {resizable && (allowHorizontalOverflow || !isLastColumn) && (
            <div
              className="IstemTable-resizeHandle"
              onMouseDown={handleResizeMouseDown(column.id as TColumnId)}
              onDoubleClick={() => resetColumnWidth(column.id as TColumnId)}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                resetColumnWidth(column.id as TColumnId);
              }}
            />
          )}
        </>
      ),
    };

    return slots?.headerCell ? (
      <React.Fragment key={column.id}>
        {slots.headerCell(propsForSlot, TableCell)}
      </React.Fragment>
    ) : (
      <TableCell key={column.id} {...propsForSlot} />
    );
  };

  const renderBodyCell = (
    column: TableColumn<TData, TColumnId>,
    row: TData,
    rowIndex: number,
    columnIndex: number,
  ) => {
    const width = widths[column.id as TColumnId];

    const bodyCellContext = { column, columnIndex, row, rowIndex };
    const bodyCellSlotProps = resolveProps(
      slotProps?.bodyCell,
      bodyCellContext,
    );
    const columnBodyCellProps = resolveProps(
      column.slotProps?.bodyCell,
      bodyCellContext,
    );
    const mergedProps = { ...bodyCellSlotProps, ...columnBodyCellProps };
    const totalWidth = tableWidth > 0 ? tableWidth : columns.length || 1;
    const widthPercent = `${(Math.max(width, 0) / totalWidth) * 100}%`;
    const columnSizeStyles = allowHorizontalOverflow
      ? { width, maxWidth: width, minWidth: width }
      : { width: widthPercent, maxWidth: widthPercent, minWidth: 0 };

    const propsForSlot = {
      ...mergedProps,
      "data-column-id": column.id,
      sx: (theme: Theme) => ({
        ...columnSizeStyles,
        overflow: "hidden",
        whiteSpace: "normal",
        wordBreak: "normal",
        overflowWrap: "normal",
        ...mergeSx(theme, bodyCellSlotProps.sx, columnBodyCellProps.sx),
      }),
      children: column.cell(row),
    };

    return slots?.bodyCell ? (
      <React.Fragment key={column.id}>
        {slots.bodyCell(propsForSlot, TableCell)}
      </React.Fragment>
    ) : (
      <TableCell key={column.id} {...propsForSlot} />
    );
  };

  // Pre-calculate Row Contents
  const headerRowPropsForSlot = {
    ...resolveProps(slotProps?.headerRow),
    children: columns.map((col, idx) => renderHeaderCell(col, idx)),
  };

  const footerCellSlotProps = resolveProps(slotProps?.footerCell);

  const footerPropsForSlot = {
    ...resolveProps(slotProps?.footerRow),
    children: (
      <TableCell colSpan={columns.length} {...footerCellSlotProps}>
        {renderFooter?.(sortedRows)}
      </TableCell>
    ),
  };

  const tableSlotProps = resolveProps(slotProps?.table);
  const tableContainerSlotProps = resolveProps(slotProps?.tableContainer);

  const tablePropsForSlot = {
    ...tableSlotProps,
    sx: (theme: Theme) => ({
      tableLayout: "fixed",
      width: allowHorizontalOverflow ? tableWidth : "100%",
      minWidth: allowHorizontalOverflow ? tableWidth : minTableWidth,
      maxWidth: "100%",
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      borderCollapse: "separate",
      borderSpacing: 0,
      ...resolveSxToObject(theme, tableSlotProps.sx),
    }),
    children: (
      <>
        <TableHead>
          {slots?.headerRow ? (
            slots.headerRow(headerRowPropsForSlot, TableRow)
          ) : (
            <TableRow {...headerRowPropsForSlot} />
          )}
        </TableHead>

        <TableBody>
          {sortedRows.map((row, rowIndex) => {
            const bodyRowPropsForSlot = {
              ...resolveProps(slotProps?.bodyRow ?? slotProps?.bodyRowProps, {
                row,
                rowIndex,
              }),
              children: columns.map((col, colIdx) =>
                renderBodyCell(col, row, rowIndex, colIdx),
              ),
            };

            return slots?.bodyRow ? (
              <React.Fragment key={rowIndex}>
                {slots.bodyRow(bodyRowPropsForSlot, TableRow)}
              </React.Fragment>
            ) : (
              <TableRow key={rowIndex} {...bodyRowPropsForSlot} />
            );
          })}
        </TableBody>

        {renderFooter && <TableFooter>{renderFooter(sortedRows)}</TableFooter>}
      </>
    ),
  };

  const containerPropsForSlot = {
    ...tableContainerSlotProps,
    sx: (theme: Theme) => ({
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      overflow: "hidden",
      borderRadius: theme.shape.borderRadius,
      position: "relative",
      ...resolveSxToObject(theme, tableContainerSlotProps.sx),
    }),
    children: (
      <Paper
        elevation={0}
        sx={(theme) => ({
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
          position: "relative",
          width: "100%",
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        })}
      >
        {resetSpacingButtonPosition && (
          <Tooltip title="Reset table spacing">
            <IconButton
              size="small"
              color="default"
              onClick={resetAllWidths}
              style={resolveResetButtonPosition(resetSpacingButtonPosition)}
              sx={(theme) => ({
                position: "absolute",
                zIndex: 5,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[2],
                "&:hover": {
                  backgroundColor: theme.palette.background.default,
                },
              })}
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <div
          ref={scrollViewportRef}
          style={{
            overflowX: "auto",
            overflowY: "auto",
            width: "100%",
            minWidth: 0,
            height: "100%",
            minHeight: 0,
          }}
        >
          {slots?.table?.(tablePropsForSlot, TableMui) ?? (
            <TableMui {...tablePropsForSlot} />
          )}
        </div>
      </Paper>
    ),
  };

  const content = slots?.tableContainer ? (
    slots.tableContainer(containerPropsForSlot, TableContainer)
  ) : (
    <TableContainer {...containerPropsForSlot} />
  );

  return content;
}

// Helper Utilities

function measureCellBreakSafeMinWidth(
  cell: HTMLElement,
  probe: HTMLSpanElement,
): number {
  const computed = window.getComputedStyle(cell);
  const horizontalPadding =
    px(computed.paddingLeft) + px(computed.paddingRight);
  const text = cell.textContent ?? "";
  const tokens = text.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return Math.ceil(horizontalPadding);

  // Apply cell styles to the shared probe
  probe.style.fontFamily = computed.fontFamily;
  probe.style.fontSize = computed.fontSize;
  probe.style.fontWeight = computed.fontWeight;
  probe.style.fontStyle = computed.fontStyle;
  probe.style.letterSpacing = computed.letterSpacing;
  probe.style.wordSpacing = computed.wordSpacing;
  probe.style.lineHeight = computed.lineHeight;
  probe.style.textTransform = computed.textTransform;

  let maxTokenWidth = 0;
  for (const token of tokens) {
    probe.textContent = token;
    maxTokenWidth = Math.max(
      maxTokenWidth,
      Math.ceil(probe.getBoundingClientRect().width),
    );
  }

  return Math.max(0, Math.ceil(maxTokenWidth + horizontalPadding));
}

function resolveProps<T, C = void>(
  value: TableSlotPropFactory<T, C> | undefined,
  context?: C,
): T {
  if (typeof value === "function") {
    const factory = value as (ctx: C) => T | undefined;
    return factory(context as C) ?? ({} as T);
  }
  return (value ?? ({} as T)) as T;
}

function resolveSxToObject(
  theme: Theme,
  sx: SxProps<Theme> | undefined,
): object {
  if (!sx) return {};
  const resolved = typeof sx === "function" ? sx(theme) : sx;
  if (!resolved) return {};
  if (Array.isArray(resolved))
    return Object.assign({}, ...(resolved.filter(Boolean) as object[]));
  return resolved as object;
}

function mergeSx(
  theme: Theme,
  ...sxs: Array<SxProps<Theme> | undefined>
): object {
  return Object.assign({}, ...sxs.map((sx) => resolveSxToObject(theme, sx)));
}

function resolveResetButtonPosition(
  position: TableResetSpacingButtonPosition,
): React.CSSProperties {
  return {
    position: "absolute",
    zIndex: 3,
    top: position.vertical === "top" ? 8 : undefined,
    bottom: position.vertical === "bottom" ? 8 : undefined,
    left: position.horizontal === "left" ? 8 : undefined,
    right: position.horizontal === "right" ? 8 : undefined,
  };
}

function px(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const Table = forwardRef(BaseTable) as <
  TData,
  TColumnId extends string = string,
>(
  props: TableProps<TData, TColumnId> & { ref?: React.Ref<TableHandle> },
) => JSX.Element;

export default Table;
