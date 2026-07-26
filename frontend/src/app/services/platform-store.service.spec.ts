import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PlatformStoreService, STORAGE_KEY } from './platform-store.service';

const ADMIN_ID = 401;
const DESIGNER_ID = 201;
const CUSTOMER_ID = 101;

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
      const raw = localStorage.getItem('printymand_platform_state_v7') ?? '';
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

      const paid = await store.payForOrder(order.id);
      expect(paid.success).toBe(false);
      expect(store.getOrderById(order.id)?.paymentStatus).toBe('unpaid');
    });

    it('moves through acceptance and payment to Confirmed', async () => {
      const order = draftOrder()!;
      expect(store.acceptOrderRequest(order.id).success).toBe(true);
      expect(store.getOrderStatus(store.getOrderById(order.id)!)).toBe('Awaiting payment');

      expect((await store.payForOrder(order.id)).success).toBe(true);
      expect(store.getOrderStatus(store.getOrderById(order.id)!)).toBe('Confirmed');
    });

    it('refuses a second decision on the same request', () => {
      const order = draftOrder()!;
      expect(store.acceptOrderRequest(order.id).success).toBe(true);
      expect(store.rejectOrderRequest(order.id).success).toBe(false);
    });

    it('will not let another customer cancel the order', () => {
      const order = draftOrder()!;
      expect(store.cancelOrderRequest(order.id, CUSTOMER_ID + 999).success).toBe(false);
      expect(store.getOrderById(order.id)?.requestStatus).toBe('REQUESTED');
    });

    it('issues one canonical reference used as the tracking code', () => {
      const order = draftOrder()!;
      expect(String(order.id)).toMatch(/^PMD-\d{6}-\d+$/);
      expect(order.trackingCode).toBe(String(order.id));
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
