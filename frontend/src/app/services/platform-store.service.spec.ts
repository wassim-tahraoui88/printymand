import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PlatformStoreService, STORAGE_KEY } from './platform-store.service';

const ADMIN_ID = 401;
const DESIGNER_ID = 201;
const CUSTOMER_ID = 101;
/** Owner of pressroom 501 (PrintPro Tunisia). */
const PRINTER_USER_ID = 301;
/** Owner of pressroom 502 (Atelier Couleurs) — never on the seeded draft order. */
const OTHER_PRINTER_USER_ID = 302;

function makeStore(): PlatformStoreService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  return TestBed.inject(PlatformStoreService);
}

describe('PlatformStoreService', () => {
  let store: PlatformStoreService;

  beforeEach(() => {
    localStorage.clear();
    store = makeStore();
  });

  describe('id generation', () => {
    it('never reuses an id across mutations that write inside a state update', () => {
      // Regression: takeNextId() writes to the same signal, so calling it from
      // within an updater silently discarded the increment and reissued ids.
      store.moderateDesign(ADMIN_ID, 701, 'APPROVED');
      store.toggleFeatured(ADMIN_ID, 'design', 701);
      store.toggleFeatured(ADMIN_ID, 'design', 702);
      store.moderateDesign(ADMIN_ID, 702, 'REJECTED');

      const logIds = store.moderationLog().map((entry) => entry.id);
      const featuredIds = store.featured().map((entry) => entry.id);
      const allIds = [...logIds, ...featuredIds];

      expect(new Set(allIds).size).toBe(allIds.length);
    });

    it('keeps ids ahead of everything restored from storage', () => {
      // A persisted blob whose nextId trails records already in it — reissuing
      // from that counter would collide with the existing design.
      const snapshot = JSON.parse(JSON.stringify(store.snapshotForTesting()));
      snapshot.nextId = 10;
      snapshot.designs.push({ ...snapshot.designs[0], id: 55_000, title: 'Restored' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

      const reloaded = makeStore();
      const created = reloaded.createUploadedDesign(CUSTOMER_ID, { title: 'B', image: 'data:,' });

      expect(created.id).toBeGreaterThan(55_000);
      const ids = reloaded.designs().map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('merges newly seeded catalog entries into an older saved state', () => {
      const snapshot = JSON.parse(JSON.stringify(store.snapshotForTesting()));
      const dropped = snapshot.products.pop();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

      // The seed still knows about the product, so it must come back rather than
      // requiring a storage-key bump that would wipe the user's own records.
      const reloaded = makeStore();
      expect(reloaded.getProductById(dropped.id)).toBeDefined();
    });
  });

  describe('sign-in', () => {
    it('accepts a seeded demo account', async () => {
      const result = await store.login('sami@printymand.tn', 'demo123');
      expect(result.success).toBe(true);
      expect(store.currentUser()?.id).toBe(CUSTOMER_ID);
    });

    it('rejects a wrong password', async () => {
      const result = await store.login('sami@printymand.tn', 'nope');
      expect(result.success).toBe(false);
      expect(store.currentUser()).toBeNull();
    });

    it('does not keep the password in readable form', () => {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '';
      expect(raw).not.toContain('demo123');
    });

    it('refuses a suspended account and signs it out', async () => {
      store.setAccountStatus(CUSTOMER_ID, 'SUSPENDED');
      const result = await store.login('sami@printymand.tn', 'demo123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('suspended');
      expect(store.currentUser()).toBeNull();
    });
  });

  describe('order lifecycle', () => {
    function draftOrder() {
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 2, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      return store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis');
    }

    it('creates a request that cannot be paid before acceptance', async () => {
      const order = draftOrder()!;
      expect(order.requestStatus).toBe('REQUESTED');
      expect(store.getOrderStatus(order)).toBe('Requested');

      const paid = await store.payForOrder(order.id, CUSTOMER_ID);
      expect(paid.success).toBe(false);
      expect(store.getOrderById(order.id)?.paymentStatus).toBe('unpaid');
    });

    it('moves through acceptance and payment to Confirmed', async () => {
      const order = draftOrder()!;
      expect(store.acceptOrderRequest(order.id, PRINTER_USER_ID).success).toBe(true);
      expect(store.getOrderStatus(store.getOrderById(order.id)!)).toBe('Awaiting payment');

      expect((await store.payForOrder(order.id, CUSTOMER_ID)).success).toBe(true);
      expect(store.getOrderStatus(store.getOrderById(order.id)!)).toBe('Confirmed');
    });

    it('refuses a second decision on the same request', () => {
      const order = draftOrder()!;
      expect(store.acceptOrderRequest(order.id, PRINTER_USER_ID).success).toBe(true);
      expect(store.rejectOrderRequest(order.id, PRINTER_USER_ID).success).toBe(false);
    });

    it('will not let another customer cancel the order', () => {
      const order = draftOrder()!;
      expect(store.cancelOrderRequest(order.id, CUSTOMER_ID + 999).success).toBe(false);
      expect(store.getOrderById(order.id)?.requestStatus).toBe('REQUESTED');
    });

    it('will not let another customer pay the order', async () => {
      const order = draftOrder()!;
      store.acceptOrderRequest(order.id, PRINTER_USER_ID);

      const paid = await store.payForOrder(order.id, CUSTOMER_ID + 999);
      expect(paid.success).toBe(false);
      expect(store.getOrderById(order.id)?.paymentStatus).toBe('unpaid');
    });

    it('will not let an unrelated pressroom decide the request', () => {
      const order = draftOrder()!;
      expect(store.acceptOrderRequest(order.id, OTHER_PRINTER_USER_ID).success).toBe(false);
      expect(store.rejectOrderRequest(order.id, OTHER_PRINTER_USER_ID).success).toBe(false);
      expect(store.getOrderById(order.id)?.requestStatus).toBe('REQUESTED');
    });

    it('only shows an order to its buyer, its pressroom and an admin', () => {
      const order = draftOrder()!;
      expect(store.canViewOrder(order.id, CUSTOMER_ID)).toBe(true);
      expect(store.canViewOrder(order.id, PRINTER_USER_ID)).toBe(true);
      expect(store.canViewOrder(order.id, ADMIN_ID)).toBe(true);
      expect(store.canViewOrder(order.id, DESIGNER_ID)).toBe(false);
      expect(store.canViewOrder(order.id, OTHER_PRINTER_USER_ID)).toBe(false);
    });

    it('issues one canonical reference used as the tracking code', () => {
      const order = draftOrder()!;
      expect(String(order.id)).toMatch(/^PMD-\d{6}-\d+$/);
      expect(order.trackingCode).toBe(String(order.id));
    });
  });

  describe('fulfillment', () => {
    async function paidOrder() {
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 2, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;
      store.acceptOrderRequest(order.id, PRINTER_USER_ID);
      await store.payForOrder(order.id, CUSTOMER_ID);
      return store.getOrderById(order.id)!;
    }

    it('refuses to advance a line before the order is paid', () => {
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;
      store.acceptOrderRequest(order.id, PRINTER_USER_ID);

      const result = store.advanceOrderLineStatus(order.id, order.lines[0].id, PRINTER_USER_ID);
      expect(result.success).toBe(false);
      expect(store.getOrderById(order.id)!.lines[0].status).toBe('Pending');
    });

    it('will not let another pressroom advance the line', async () => {
      const order = await paidOrder();
      const result = store.advanceOrderLineStatus(order.id, order.lines[0].id, OTHER_PRINTER_USER_ID);
      expect(result.success).toBe(false);
      expect(store.getOrderById(order.id)!.lines[0].status).toBe('Confirmed');
    });

    it('pays the printer its production price and the designer the frozen royalty', async () => {
      const order = await paidOrder();
      const line = order.lines[0];
      // Seed orders already contribute delivered work, so assert on the delta.
      const revenueBefore = store.printerTotals(PRINTER_USER_ID).revenue;
      const balanceBefore = store.getUserById(DESIGNER_ID)!.designerProfile!.payoutBalance ?? 0;

      for (const _ of ['Printing', 'Shipped', 'Delivered']) {
        store.advanceOrderLineStatus(order.id, line.id, PRINTER_USER_ID);
      }
      expect(store.getOrderById(order.id)!.lines[0].status).toBe('Delivered');

      // The printer banks its own amount — never the customer price.
      const payouts = store.printerPayoutsForUser(PRINTER_USER_ID).filter((p) => String(p.orderId) === String(order.id));
      expect(payouts.reduce((sum, p) => sum + p.amount, 0)).toBe(line.printerAmount);
      expect(store.printerTotals(PRINTER_USER_ID).revenue - revenueBefore).toBe(line.printerAmount);
      expect(line.printerAmount).toBeLessThan(line.price);

      // ...and the designer exactly the royalty frozen on the line.
      const balanceAfter = store.getUserById(DESIGNER_ID)!.designerProfile!.payoutBalance ?? 0;
      expect(balanceAfter - balanceBefore).toBe(line.designerRoyalty);
    });

    it('scores the designer by units sold, not by head count', async () => {
      const order = await paidOrder();
      const scoreBefore = store.getUserById(DESIGNER_ID)!.designerProfile!.salesScore ?? 0;

      for (const _ of ['Printing', 'Shipped', 'Delivered']) {
        store.advanceOrderLineStatus(order.id, order.lines[0].id, PRINTER_USER_ID);
      }

      const scoreAfter = store.getUserById(DESIGNER_ID)!.designerProfile!.salesScore ?? 0;
      expect(scoreAfter - scoreBefore).toBe(order.lines[0].quantity);
    });

    it('reports no revenue for work that is not delivered yet', async () => {
      const before = store.printerTotals(PRINTER_USER_ID).revenue;
      await paidOrder();
      // Paid and confirmed, but nothing produced — revenue must not move.
      expect(store.printerTotals(PRINTER_USER_ID).revenue).toBe(before);
    });
  });

  describe('visibility', () => {
    it('keeps personal uploads out of the marketplace', () => {
      const upload = store.createUploadedDesign(CUSTOMER_ID, { title: 'Private', image: 'data:,' });
      expect(store.marketplaceDesigns().some((d) => d.id === upload.id)).toBe(false);
    });

    it('keeps unmoderated designs out of the marketplace and storefronts', () => {
      const pending = store.addOrUpdateDesign(
        { title: 'Draft', image: 'data:,', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      expect(pending.moderation).toBe('PENDING');
      expect(store.marketplaceDesigns().some((d) => d.id === pending.id)).toBe(false);
      expect(store.storefrontDesigns(DESIGNER_ID).some((d) => d.id === pending.id)).toBe(false);
    });

    it('sends an approved design back to the queue when its artwork changes', () => {
      const design = store.addOrUpdateDesign(
        { title: 'Clean', image: 'data:,original', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      store.moderateDesign(ADMIN_ID, design.id, 'APPROVED');
      expect(store.getDesignById(design.id)!.moderation).toBe('APPROVED');

      // Swapping the artwork on a live design must not inherit the old verdict.
      store.addOrUpdateDesign(
        { id: design.id, title: 'Clean', image: 'data:,swapped', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      expect(store.getDesignById(design.id)!.moderation).toBe('PENDING');
      expect(store.marketplaceDesigns().some((d) => d.id === design.id)).toBe(false);
    });

    it('keeps the verdict when only the copy changes', () => {
      const design = store.addOrUpdateDesign(
        { title: 'Clean', image: 'data:,original', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      store.moderateDesign(ADMIN_ID, design.id, 'APPROVED');

      store.addOrUpdateDesign(
        { id: design.id, title: 'Cleaner', image: 'data:,original', category: 'Minimal', description: 'y' },
        DESIGNER_ID,
      );
      expect(store.getDesignById(design.id)!.moderation).toBe('APPROVED');
    });

    it('makes a rejected design visible again once it is approved', () => {
      const design = store.addOrUpdateDesign(
        { title: 'Retry', image: 'data:,v1', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      store.moderateDesign(ADMIN_ID, design.id, 'REJECTED');
      expect(store.getDesignById(design.id)!.status).toBe('REMOVED');

      // Re-approving used to leave status REMOVED — approved but invisible.
      store.moderateDesign(ADMIN_ID, design.id, 'APPROVED');
      expect(store.getDesignById(design.id)!.status).toBe('ACTIVE');
      expect(store.marketplaceDesigns().some((d) => d.id === design.id)).toBe(true);
    });

    it('excludes revenue and total users from public stats', () => {
      const stats = store.publicStats() as Record<string, unknown>;
      expect('revenue' in stats).toBe(false);
      expect('users' in stats).toBe(false);
      expect(stats['pressrooms']).toBeGreaterThan(0);
    });
  });

  describe('seed data integrity', () => {
    it('only assigns designs to products that exist', () => {
      const productIds = new Set(store.products().map((p) => p.id));
      for (const design of store.designs()) {
        for (const id of design.assignedProductIds) {
          expect(productIds.has(id)).toBe(true);
        }
      }
    });

    it('gives every catalog product at least one printable design', () => {
      // The reverse mapping is derived, so a product with no designs means the
      // design side genuinely forgot it (as the Sticker previously had).
      for (const product of store.products()) {
        expect(store.availableDesignsForProduct(product.id).length).toBeGreaterThan(0);
      }
    });

    it('configures a placement for every product a design is assigned to', () => {
      for (const design of store.designs()) {
        const configured = new Set(design.productConfigurations.map((c) => c.productId));
        for (const id of design.assignedProductIds) {
          expect(configured.has(id)).toBe(true);
        }
      }
    });

    it('only offers colours and sizes the product actually has', () => {
      for (const design of store.designs()) {
        for (const cfg of design.productConfigurations) {
          const product = store.getProductById(cfg.productId)!;
          for (const colour of cfg.availableColors) {
            expect(product.colors).toContain(colour);
          }
        }
      }
    });

    it('names order lines after the global catalog product', () => {
      for (const order of store.orders()) {
        for (const line of order.lines) {
          expect(line.productName).toBe(store.getProductById(line.productId)!.name);
        }
      }
    });

    it('prices order lines from the printer offering plus the platform margin', () => {
      const margin = store.platformSettings().margin;
      for (const order of store.orders()) {
        for (const line of order.lines) {
          const expected = store.offeringPrice(line.printerId!, line.productId) + margin;
          expect(line.price).toBe(expected);
          expect(line.printerAmount! + line.platformFee!).toBe(line.price);
        }
        expect(order.total).toBe(order.lines.reduce((sum, l) => sum + l.price, 0));
      }
    });

    it('uses the canonical tracking-code format on seed orders', () => {
      for (const order of store.orders()) {
        expect(order.trackingCode).toMatch(/^PMD-\d{6}-\d+$/);
      }
    });

    it('points every review at the thing it reviews', () => {
      for (const review of store.reviews()) {
        if (review.target === 'design') expect(review.designId).toBeDefined();
        if (review.target === 'printer') expect(review.printerId).toBeDefined();
      }
    });

    it('sizes order lines within the product size options', () => {
      for (const order of store.orders()) {
        for (const line of order.lines) {
          expect(store.getProductById(line.productId)!.sizes).toContain(line.size);
        }
      }
    });
  });

  describe('ratings', () => {
    it('does not halve a new design on its first review', async () => {
      const design = store.addOrUpdateDesign(
        { title: 'Fresh', image: 'data:,v1', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      store.moderateDesign(ADMIN_ID, design.id, 'APPROVED');
      expect(store.getDesignById(design.id)!.rating).toBe(0);

      store.setCustomizationDraft({
        designId: design.id,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      store.assignProductsToDesign(design.id, [601]);
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;
      store.acceptOrderRequest(order.id, PRINTER_USER_ID);
      await store.payForOrder(order.id, CUSTOMER_ID);
      for (const _ of ['Printing', 'Shipped', 'Delivered']) {
        store.advanceOrderLineStatus(order.id, order.lines[0].id, PRINTER_USER_ID);
      }

      await store.submitReview(order.id, CUSTOMER_ID, {
        target: 'design',
        designId: design.id,
        rating: 5,
        comment: 'Great',
      });

      // (0 + 5) / 2 = 2.5 was the old, wrong answer.
      expect(store.getDesignById(design.id)!.rating).toBe(5);
    });

    it('weights a printer review against its rating history', async () => {
      const printer = store.getPrinterById(501)!;
      const { rating: before, reviews: count } = printer;

      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;
      store.acceptOrderRequest(order.id, PRINTER_USER_ID);
      await store.payForOrder(order.id, CUSTOMER_ID);
      for (const _ of ['Printing', 'Shipped', 'Delivered']) {
        store.advanceOrderLineStatus(order.id, order.lines[0].id, PRINTER_USER_ID);
      }

      await store.submitReview(order.id, CUSTOMER_ID, {
        target: 'printer',
        printerId: 501,
        rating: 1,
        comment: 'Late',
      });

      const after = store.getPrinterById(501)!;
      expect(after.reviews).toBe(count + 1);
      expect(after.rating).toBe(Math.round(((before * count + 1) / (count + 1)) * 10) / 10);
      // One bad review among hundreds must barely move a 4.9.
      expect(before - after.rating).toBeLessThan(0.2);
    });
  });

  describe('platform revenue', () => {
    it('counts only paid orders, and keeps the margin net of the royalty', async () => {
      const before = store.adminOverview();

      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 2, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;

      // Requested but unpaid — no money has moved.
      expect(store.adminOverview().revenue).toBe(before.revenue);
      expect(store.adminOverview().grossVolume).toBe(before.grossVolume);

      store.acceptOrderRequest(order.id, PRINTER_USER_ID);
      await store.payForOrder(order.id, CUSTOMER_ID);

      const line = store.getOrderById(order.id)!.lines[0];
      const after = store.adminOverview();
      expect(after.grossVolume - before.grossVolume).toBe(order.total);
      expect(after.revenue - before.revenue).toBe(line.platformFee! - line.designerRoyalty!);
      // The platform keeps less than the customer paid.
      expect(after.revenue - before.revenue).toBeLessThan(order.total);
    });

    it('ignores a rejected request entirely', () => {
      const before = store.adminOverview();
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Somewhere, Tunis')!;
      store.rejectOrderRequest(order.id, PRINTER_USER_ID, 'Out of stock');

      expect(store.adminOverview().revenue).toBe(before.revenue);
      expect(store.adminOverview().grossVolume).toBe(before.grossVolume);
    });
  });

  describe('draft validation', () => {
    function draft() {
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
    }

    it('accepts a draft whose pressroom is open and still prints the product', () => {
      draft();
      expect(store.draftIssue()).toBeNull();
      expect(store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')).not.toBeNull();
    });

    it('refuses a draft once the pressroom goes on holiday', () => {
      draft();
      store.setPrinterAvailability(PRINTER_USER_ID, 'holiday');

      expect(store.draftIssue()).toContain('not accepting orders');
      expect(store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')).toBeNull();
    });

    it('refuses a draft once the pressroom drops the product', () => {
      draft();
      store.removePrinterOffering(PRINTER_USER_ID, 601);

      expect(store.draftIssue()).toContain('no longer prints');
      expect(store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')).toBeNull();
    });

    it('refuses a draft once the admin pauses the product', () => {
      draft();
      store.addOrUpdateGlobalProduct({ ...store.getProductById(601)!, availability: 'PAUSED' });

      expect(store.draftIssue()).toContain('no longer available');
      expect(store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')).toBeNull();
    });

    it('drops a removed product from an in-flight draft', () => {
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [
          { productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } },
          { productId: 603, color: 'white', size: '11oz', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } },
        ],
      });
      store.removeGlobalProduct(601);

      expect(store.customizationDraft()!.items.map((item) => item.productId)).toEqual([603]);

      // Removing the last one clears the draft rather than stranding the buyer.
      store.removeGlobalProduct(603);
      expect(store.customizationDraft()).toBeNull();
    });

    it('starts an order on the buyer\'s default saved payment method', () => {
      draft();
      // Seed customer 101 has a default card preference.
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')!;
      expect(order.paymentMethod).toBe(store.defaultPaymentMethod(CUSTOMER_ID));
      expect(order.paymentMethod).toBe('card');
    });
  });

  describe('product availability', () => {
    it('stops offering a product for order once it is paused', () => {
      expect(store.availableProductsForDesign(701).some((p) => p.id === 601)).toBe(true);
      store.addOrUpdateGlobalProduct({ ...store.getProductById(601)!, availability: 'PAUSED' });
      expect(store.availableProductsForDesign(701).some((p) => p.id === 601)).toBe(false);
    });

    it('keeps a personal upload printable on whatever the catalog holds today', () => {
      const upload = store.createUploadedDesign(CUSTOMER_ID, { title: 'Mine', image: 'data:,' });
      const added = store.addOrUpdateGlobalProduct({
        name: 'Cap',
        category: 'Accessories',
        description: 'x',
        basePrice: 20,
        colors: ['black'],
        sizes: ['One Size'],
        images: ['/placeholder-image.svg'],
      });

      // A snapshot taken at upload time would have missed this.
      expect(store.availableProductsForDesign(upload.id).some((p) => p.id === added.id)).toBe(true);
    });
  });

  describe('reviews', () => {
    async function deliveredTwoDesignOrder() {
      // Two DIFFERENT designs, one pressroom, in a single order.
      store.setCustomizationDraft({
        designId: 701,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')!;
      // Splice a second design onto the same order to model a mixed basket.
      const second = store.getDesignById(702)!;
      const snapshot = store.snapshotForTesting();
      const target = snapshot.orders.find((o) => o.id === order.id)!;
      target.lines.push({ ...target.lines[0], id: target.lines[0].id + 1, designId: second.id, designTitle: second.title });

      store.acceptOrderRequest(order.id, PRINTER_USER_ID);
      await store.payForOrder(order.id, CUSTOMER_ID);
      for (const line of store.getOrderById(order.id)!.lines) {
        for (const _ of ['Printing', 'Shipped', 'Delivered']) {
          store.advanceOrderLineStatus(order.id, line.id, PRINTER_USER_ID);
        }
      }
      return store.getOrderById(order.id)!;
    }

    it('offers every design on the order, plus its pressroom', async () => {
      const order = await deliveredTwoDesignOrder();
      const targets = store.reviewTargetsForOrder(order.id);
      expect(targets.designs.map((d) => d.id).sort()).toEqual([701, 702]);
      expect(targets.printers.map((p) => p.id)).toEqual([501]);
    });

    it('accepts a review for the second design too', async () => {
      const order = await deliveredTwoDesignOrder();

      expect((await store.submitReview(order.id, CUSTOMER_ID, { target: 'design', designId: 701, rating: 5, comment: 'a' })).success).toBe(true);
      // Previously blocked: the duplicate check keyed on target alone.
      expect((await store.submitReview(order.id, CUSTOMER_ID, { target: 'design', designId: 702, rating: 4, comment: 'b' })).success).toBe(true);

      // ...but the SAME design twice is still refused.
      const repeat = await store.submitReview(order.id, CUSTOMER_ID, { target: 'design', designId: 701, rating: 1, comment: 'c' });
      expect(repeat.success).toBe(false);
      expect(store.hasReviewed(order.id, CUSTOMER_ID, 'design', 702)).toBe(true);
    });

    it('never asks a buyer to rate their own uploaded artwork', () => {
      const upload = store.createUploadedDesign(CUSTOMER_ID, { title: 'Mine', image: 'data:,' });
      store.setCustomizationDraft({
        designId: upload.id,
        selectedPrinterId: 501,
        items: [{ productId: 601, color: 'white', size: 'M', quantity: 1, placement: { x: 50, y: 46, scale: 0.42 } }],
      });
      const order = store.submitDraftOrderRequest(CUSTOMER_ID, 'Tunis')!;

      const targets = store.reviewTargetsForOrder(order.id);
      expect(targets.designs).toEqual([]);
      expect(targets.printers.map((p) => p.id)).toEqual([501]);
    });
  });

  describe('designer payouts', () => {
    function requestPayout() {
      store.saveDesignerProfile(DESIGNER_ID, { payoutBalance: 200 });
      expect(store.requestDesignerPayout(DESIGNER_ID).success).toBe(true);
      return store.payouts().find((p) => p.designerId === DESIGNER_ID && p.status === 'requested')!;
    }

    it('can be carried through to paid', () => {
      const payout = requestPayout();
      expect(store.pendingPayouts().some((p) => p.id === payout.id)).toBe(true);

      store.setPayoutStatus(ADMIN_ID, payout.id, 'processing');
      expect(store.payouts().find((p) => p.id === payout.id)!.status).toBe('processing');

      store.setPayoutStatus(ADMIN_ID, payout.id, 'paid');
      expect(store.payouts().find((p) => p.id === payout.id)!.status).toBe('paid');
      // Settled payouts drop off the admin's queue.
      expect(store.pendingPayouts().some((p) => p.id === payout.id)).toBe(false);
    });

    it('tells the designer when their money moves', () => {
      const payout = requestPayout();
      store.setPayoutStatus(ADMIN_ID, payout.id, 'paid');

      const messages = store.notifications().filter((n) => n.userId === DESIGNER_ID).map((n) => n.message);
      expect(messages.some((m) => m.includes('has been paid out'))).toBe(true);
    });
  });

  describe('categories', () => {
    it('serves one list, owned by platform settings', () => {
      expect(store.categories()).toEqual(store.platformSettings().categories);
    });

    it('never includes the "All" UI affordance as a real category', () => {
      expect(store.categories()).not.toContain('All');
    });

    it('follows an admin edit', () => {
      store.updatePlatformSettings({ categories: ['Culture', 'Retro'] });
      expect(store.categories()).toEqual(['Culture', 'Retro']);
    });
  });

  describe('design pricing', () => {
    it('prices a design from its cheapest product plus the margin', () => {
      const design = store.getDesignById(701)!;
      const margin = store.platformSettings().margin;
      const cheapest = Math.min(...store.availableProductsForDesign(701).map((p) => p.basePrice));
      expect(store.designFromPrice(design)).toBe(cheapest + margin);
    });

    it('tracks the margin rather than the legacy design fee', () => {
      const design = store.getDesignById(701)!;
      const before = store.designFromPrice(design)!;
      store.updatePlatformSettings({ margin: 25 });
      expect(store.designFromPrice(store.getDesignById(701)!)).toBe(before - 10 + 25);
    });

    it('returns null when nothing is printable', () => {
      const orphan = store.addOrUpdateDesign(
        { title: 'Orphan', image: 'data:,', category: 'Minimal', description: 'x' },
        DESIGNER_ID,
      );
      expect(store.designFromPrice(orphan)).toBeNull();
    });
  });

  describe('printer offerings', () => {
    it('clamps a printer price to the admin floor', () => {
      const floor = store.getProductById(601)!.basePrice;
      const result = store.setPrinterOffering(301, 601, floor - 10, true);
      expect(result.clamped).toBe(true);
      expect(store.offeringPrice(store.getPrinterByUserId(301)!.id, 601)).toBe(floor);
    });

    it('never quotes below the floor, even after an admin raises it', () => {
      const printerId = store.getPrinterByUserId(PRINTER_USER_ID)!.id;
      store.setPrinterOffering(PRINTER_USER_ID, 601, 30, true);
      expect(store.offeringPrice(printerId, 601)).toBe(30);

      // Raising the floor must re-price existing offerings, not leave them under it.
      store.addOrUpdateGlobalProduct({ ...store.getProductById(601)!, basePrice: 40 });
      expect(store.offeringPrice(printerId, 601)).toBe(40);
    });

    it('ships seed offerings that already respect their floor', () => {
      for (const offering of store.offerings()) {
        const floor = store.getProductById(offering.productId)!.basePrice;
        expect(offering.basePrice).toBeGreaterThanOrEqual(floor);
      }
    });

    it('retires rather than deletes a pressroom when its owner changes role', () => {
      const printer = store.getPrinterByUserId(301)!;
      store.updateUserRole(301, 'customer');

      // The partner record still resolves for historical order lines...
      expect(store.getPrinterById(printer.id)).toBeDefined();
      // ...but is no longer offered for new orders.
      expect(store.printersForProduct(601).some((p) => p.id === printer.id)).toBe(false);
    });
  });
});
