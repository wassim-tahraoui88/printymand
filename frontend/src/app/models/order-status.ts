/**
 * Canonical customer-facing order stages, as produced by
 * `PlatformStoreService.getOrderStatus()`. Anything that filters or styles an
 * order stage must use these values rather than ad-hoc string literals.
 */
export const ORDER_STAGES = [
  'Requested',
  'Awaiting payment',
  'Confirmed',
  'Printing',
  'Shipped',
  'Delivered',
  'Rejected',
  'Cancelled',
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

/** Stages where the order is live and still moving toward delivery. */
export const IN_FLIGHT_STAGES: readonly OrderStage[] = [
  'Requested',
  'Awaiting payment',
  'Confirmed',
  'Printing',
  'Shipped',
];

/** Terminal stages — no further progress is possible. */
export const CLOSED_STAGES: readonly OrderStage[] = ['Delivered', 'Rejected', 'Cancelled'];

export function isInFlight(stage: string): boolean {
  return (IN_FLIGHT_STAGES as readonly string[]).includes(stage);
}

/**
 * Badge classes for an order stage or an order-line status.
 * Every value produced here has a matching `.pm-status-*` rule in styles.css.
 */
export function orderStatusClass(status: string): string {
  return `pm-status pm-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}
