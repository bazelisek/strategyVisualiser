import type { ReactNode } from 'react';
import type {
  TableCellProps as MuiTableCellProps,
  TableContainerProps as MuiTableContainerProps,
  TableRowProps as MuiTableRowProps,
} from '@mui/material';
import { TableProps as MuiTableProps } from '@mui/material/Table';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface TableColumn<TData, TId extends string = string> {
  /**
   * Unique, stable column identifier.
   * Used for widths, sorting, and persistence.
   */
  id: TId;
  /**
   * Header content shown in the table head.
   */
  header: ReactNode;
  /**
   * Content renderer for each cell in this column.
   */
  cell: (row: TData) => ReactNode;
  /**
   * Minimum width in pixels for this column.
   * Defaults to 80.
   */
  minWidth?: number;
  /**
   * Maximum width in pixels for this column.
   * Defaults to 600.
   */
  maxWidth?: number;
  /**
   * Default width in pixels when no persisted width exists.
   * If omitted, a reasonable default is derived from the table layout.
   */
  defaultWidth?: number;
  /**
   * Enables sorting for this column.
   * If false, clicking header will not change sort state.
   */
  sortable?: boolean;
  slotProps?: {
    headerCell?: TableCellSlotProps | ((context: TableHeaderCellContext<TData, TId>) => TableCellSlotProps | undefined);
    bodyCell?: TableCellSlotProps | ((context: TableBodyCellContext<TData, TId>) => TableCellSlotProps | undefined);
  };
  /**
   * Props applied to this column's header cell.
   * May be an object or a factory based on column context.
   
  headerCellProps?: TableCellSlotProps | ((context: TableHeaderCellContext<TData, TId>) => TableCellSlotProps | undefined);
  /**
   * Props applied to every body cell in this column.
   * May be an object or a factory based on row/column context.
   
  bodyCellProps?: TableCellSlotProps | ((context: TableBodyCellContext<TData, TId>) => TableCellSlotProps | undefined);*/
}

export interface TableHeaderCellContext<TData, TColumnId extends string = string> {
  column: TableColumn<TData, TColumnId>;
  columnIndex: number;
}

export interface TableBodyCellContext<TData, TColumnId extends string = string> {
  column: TableColumn<TData, TColumnId>;
  columnIndex: number;
  row: TData;
  rowIndex: number;
}

export interface TableBodyRowContext<TData> {
  row: TData;
  rowIndex: number;
}

export interface TableSortingState<TColumnId extends string = string> {
  columnId: TColumnId | null;
  direction: SortDirection;
}

export type TableSlotRenderer<TProps> = (
  /**
   * Props that will be passed to the default MUI component,
   * including any `slotProps` that the consumer provided.
   */
  props: TProps & { children?: ReactNode },
  /**
   * The default MUI component used for this slot.
   * Consumers can render it directly or ignore it.
   */
  DefaultComponent: React.ElementType
) => ReactNode;

export type TableContainerSlotProps = Omit<MuiTableContainerProps, 'children' | 'component'>;
export type TableSlotTableProps = Omit<MuiTableProps, 'children' | 'size' | 'stickyHeader'>;
export type TableRowSlotProps = Omit<MuiTableRowProps, 'children' | 'key'>;
export type TableCellSlotProps = Omit<MuiTableCellProps, 'children' | 'key' | 'colSpan'>;
export type TableSlotPropFactory<TProps, TContext = void> = TContext extends void
  ? TProps | (() => TProps | undefined)
  : TProps | ((context: TContext) => TProps | undefined);

export interface TableResetSpacingButtonPosition {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
}

export interface TableSlots {
  tableContainer?: TableSlotRenderer<TableContainerSlotProps>;
  table?: TableSlotRenderer<TableSlotTableProps>;
  headerRow?: TableSlotRenderer<TableRowSlotProps>;
  bodyRow?: TableSlotRenderer<TableRowSlotProps>;
  footerRow?: TableSlotRenderer<TableRowSlotProps>;
  headerCell?: TableSlotRenderer<TableCellSlotProps>;
  bodyCell?: TableSlotRenderer<TableCellSlotProps>;
  footerCell?: TableSlotRenderer<TableCellSlotProps>;
}

export interface TableSlotProps<TData, TColumnId extends string = string> {
  tableContainer?: TableSlotPropFactory<TableContainerSlotProps>;
  table?: TableSlotPropFactory<TableSlotTableProps>;
  headerRow?: TableSlotPropFactory<TableRowSlotProps>;
  bodyRow?: TableSlotPropFactory<TableRowSlotProps, TableBodyRowContext<TData>>;
  bodyRowProps?: TableSlotPropFactory<TableRowSlotProps, TableBodyRowContext<TData>>;
  footerRow?: TableSlotPropFactory<TableRowSlotProps>;
  headerCell?: TableSlotPropFactory<TableCellSlotProps, TableHeaderCellContext<TData, TColumnId>>;
  bodyCell?: TableSlotPropFactory<TableCellSlotProps, TableBodyCellContext<TData, TColumnId>>;
  footerCell?: TableSlotPropFactory<TableCellSlotProps>;
}

export interface TableProps<TData, TColumnId extends string = string> {
  resizeSensitivity?: number;
  /**
   * Unique key to scope localStorage persistence.
   * If omitted, a random key with the `IstemUI-Table-` prefix
   * will be generated for this table instance.
   */
  storageKey?: string;
  /**
   * Column definitions.
   */
  columns: TableColumn<TData, TColumnId>[];
  /**
   * Raw data items (never mutated).
   */
  rows: TData[];
  /**
   * When true, columns can be resized via header borders.
   */
  resizable?: boolean;
  /**
   * When true, table width may grow beyond its container
   * and horizontal scrolling is allowed.
   * In this mode, resizing to the left cascades into columns
   * on the left side only (without compensating on the right).
   * When false, total table width is kept constant and
   * resizing cascades between left and right adjacent groups.
   */
  allowHorizontalOverflow?: boolean;
  /**
   * Optional initial sort state.
   * If omitted, will restore from localStorage or start unsorted.
   */
  initialSortState?: TableSortingState<TColumnId>;
  /**
   * Called whenever sorting changes.
   */
  onSortChange?: (state: TableSortingState<TColumnId>) => void;
  /**
   * Custom renderers for internal MUI building blocks
   * (e.g. table, container, rows, cells).
   */
  slots?: TableSlots;
  /**
   * Additional props forwarded to the underlying MUI components
   * used for the corresponding slots.
   */
  slotProps?: TableSlotProps<TData, TColumnId>;
  /**
   * Optional position for a small floating button that resets
   * the table spacing (column widths) back to their defaults.
   * When omitted, the button is not rendered.
   */
  resetSpacingButtonPosition?: TableResetSpacingButtonPosition;
  renderFooter?: (rows: TData[]) => ReactNode;
}

export interface TableRef {
  /**
   * Reset all column widths to their defaults and clear persistence.
   */
  resetColumnWidths: () => void;
  /**
   * Reset sorting to the provided initial state or to unsorted.
   */
  resetSorting: () => void;
}
