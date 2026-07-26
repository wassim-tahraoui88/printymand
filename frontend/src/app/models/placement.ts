/** Where a design sits on a product mockup: percentage offsets plus a scale. */
export interface Placement {
  x: number;
  y: number;
  scale: number;
}

/**
 * Placement used when the designer has not configured one for a product:
 * centred, slightly above middle, 42% width. Shared so every preview surface
 * composites artwork identically.
 */
export const DEFAULT_PLACEMENT: Placement = { x: 50, y: 48, scale: 0.42 };
