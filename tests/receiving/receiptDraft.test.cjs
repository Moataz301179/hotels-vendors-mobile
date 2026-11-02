const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createReceiptDraftLines,
  summarizeReceiptLine,
  validateReceiptDraft,
  receiptDraftStorageKey,
} = require("../../src/receiving/receiptDraft.js");

function sampleOrder(overrides = {}) {
  return {
    id: "order-1",
    orderNumber: "PO-1",
    status: "IN_TRANSIT",
    paymentGuaranteed: true,
    estimatedDelivery: null,
    currency: "EGP",
    canRecordReceipt: true,
    items: [
      { id: "line-1", quantity: 10, receivedQuantity: 2, remainingQuantity: 8,
        product: { id: "product-1", name: "Towels", sku: "T-1", unitOfMeasure: "case" } },
    ],
    ...overrides,
  };
}

test("creates one blank draft line per authorized PO line", () => {
  assert.deepEqual(createReceiptDraftLines(sampleOrder()), [{
    orderItemId: "line-1", receivedQuantity: 0, acceptedQuantity: 0, reviewed: false,
    rejectionReason: "", conditionNotes: "",
  }]);
});

test("derives missing and damaged quantities without prices or financing fields", () => {
  const summary = summarizeReceiptLine(sampleOrder().items[0], {
    orderItemId: "line-1", receivedQuantity: 5, acceptedQuantity: 4, reviewed: true,
  });
  assert.deepEqual(summary, { missingQuantity: 3, damagedOrRejectedQuantity: 1 });
});

test("accepts an in-transit partial receipt with one valid line", () => {
  const order = sampleOrder();
  const lines = [{ orderItemId: "line-1", receivedQuantity: 5, acceptedQuantity: 4, reviewed: true,
    rejectionReason: "Damaged carton", conditionNotes: "One case has wet packaging" }];
  assert.equal(validateReceiptDraft(order, lines), null);
});

test("does not classify untouched quantities as missing and requires explicit review", () => {
  const order = sampleOrder();
  const blank = createReceiptDraftLines(order);
  assert.equal(summarizeReceiptLine(order.items[0], blank[0]).missingQuantity, null);
  assert.match(validateReceiptDraft(order, blank), /review every purchase order line/i);
  const zeroReviewed = [{ orderItemId: "line-1", receivedQuantity: 0, acceptedQuantity: 0, reviewed: true }];
  assert.equal(summarizeReceiptLine(order.items[0], zeroReviewed[0]).missingQuantity, 8);
});

test("blocks a draft when server context says user cannot record receipt", () => {
  assert.match(validateReceiptDraft(sampleOrder({ canRecordReceipt: false }), [
    { orderItemId: "line-1", receivedQuantity: 1, acceptedQuantity: 1, reviewed: true },
  ]), /not authorized/i);
});

test("blocks unguaranteed or wrong-status orders", () => {
  const lines = [{ orderItemId: "line-1", receivedQuantity: 1, acceptedQuantity: 1 }];
  assert.match(validateReceiptDraft(sampleOrder({ paymentGuaranteed: false }), lines), /not cleared/i);
  assert.match(validateReceiptDraft(sampleOrder({ status: "DELIVERED" }), lines), /receivable status/i);
});

test("rejects over-receipt, fractional quantities, missing damage reason, and duplicate lines", () => {
  const order = sampleOrder();
  assert.match(validateReceiptDraft(order, [{ orderItemId: "line-1", receivedQuantity: 9, acceptedQuantity: 9, reviewed: true }]), /exceed/i);
  assert.match(validateReceiptDraft(order, [{ orderItemId: "line-1", receivedQuantity: 1.5, acceptedQuantity: 1, reviewed: true }]), /whole numbers/i);
  assert.match(validateReceiptDraft(order, [{ orderItemId: "line-1", receivedQuantity: 2, acceptedQuantity: 1, reviewed: true }]), /reason/i);
  const duplicateOrder = sampleOrder({ items: [...sampleOrder().items, ...sampleOrder().items.map((item) => ({ ...item, id: "line-2" }))] });
  assert.match(validateReceiptDraft(duplicateOrder, [
    { orderItemId: "line-1", receivedQuantity: 1, acceptedQuantity: 1, reviewed: true },
    { orderItemId: "line-1", receivedQuantity: 1, acceptedQuantity: 1, reviewed: true },
  ]), /exactly once/i);
});

test("scopes local draft keys to both signed-in user and PO", () => {
  const first = receiptDraftStorageKey("user-a", "order-1");
  assert.notEqual(first, receiptDraftStorageKey("user-b", "order-1"));
  assert.notEqual(first, receiptDraftStorageKey("user-a", "order-2"));
  assert.throws(() => receiptDraftStorageKey("", "order-1"), /signed-in user/i);
});
