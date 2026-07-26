import { ORDER_STAGES, isInFlight, orderStatusClass } from './order-status';

describe('order-status helpers', () => {
  it('produces a css class for every stage the store can report', () => {
    // Guards against the drift where getOrderStatus() returned stages that had
    // no matching .pm-status-* rule and therefore rendered unstyled.
    const expected: Record<string, string> = {
      Requested: 'pm-status pm-status-requested',
      'Awaiting payment': 'pm-status pm-status-awaiting-payment',
      Confirmed: 'pm-status pm-status-confirmed',
      Printing: 'pm-status pm-status-printing',
      Shipped: 'pm-status pm-status-shipped',
      Delivered: 'pm-status pm-status-delivered',
      Rejected: 'pm-status pm-status-rejected',
      Cancelled: 'pm-status pm-status-cancelled',
    };
    for (const stage of ORDER_STAGES) {
      expect(orderStatusClass(stage)).toBe(expected[stage]);
    }
  });

  it('treats every pre-delivery stage as in flight', () => {
    expect(isInFlight('Requested')).toBe(true);
    expect(isInFlight('Awaiting payment')).toBe(true);
    expect(isInFlight('Confirmed')).toBe(true);
    expect(isInFlight('Printing')).toBe(true);
    expect(isInFlight('Shipped')).toBe(true);
  });

  it('does not count terminal stages as in flight', () => {
    expect(isInFlight('Delivered')).toBe(false);
    expect(isInFlight('Rejected')).toBe(false);
    expect(isInFlight('Cancelled')).toBe(false);
  });

  it('ignores statuses that are not real stages', () => {
    // 'Pending' and 'Accepted' were previously matched by the dashboard filter
    // but are never returned by getOrderStatus().
    expect(isInFlight('Pending')).toBe(false);
    expect(isInFlight('Accepted')).toBe(false);
  });
});
