function createReceiptDraftLines(order) {
  if (!order || !Array.isArray(order.items)) return [];
  return order.items.map((item) => ({
    orderItemId: item.id,
    receivedQuantity: 0,
    acceptedQuantity: 0,
    rejectionReason: "",
    conditionNotes: "",
  }));
}

function summarizeReceiptLine(item, line) {
  const receivedQuantity = Number(line?.receivedQuantity ?? 0);
  const acceptedQuantity = Number(line?.acceptedQuantity ?? 0);
  return {
    missingQuantity: Math.max(0, item.remainingQuantity - receivedQuantity),
    damagedOrRejectedQuantity: Math.max(0, receivedQuantity - acceptedQuantity),
  };
}

function validateReceiptDraft(order, lines) {
  if (!order || order.canRecordReceipt !== true) return "This purchase order is not authorized for receiving.";
  if (order.paymentGuaranteed !== true) return "This purchase order is not cleared for receiving.";
  if (!["IN_TRANSIT", "PARTIALLY_DELIVERED"].includes(order.status)) {
    return "This purchase order is not in a receivable status.";
  }
  if (!Array.isArray(order.items) || order.items.length === 0) return "This purchase order has no receivable items.";
  if (!Array.isArray(lines) || lines.length !== order.items.length) return "Every purchase order line must be reviewed.";

  const itemById = new Map(order.items.map((item) => [item.id, item]));
  const seen = new Set();
  let totalReceived = 0;

  for (const line of lines) {
    if (!line || typeof line.orderItemId !== "string" || seen.has(line.orderItemId)) {
      return "Each purchase order line must appear exactly once.";
    }
    seen.add(line.orderItemId);
    const item = itemById.get(line.orderItemId);
    if (!item) return "A receipt line does not belong to this purchase order.";

    const received = Number(line.receivedQuantity);
    const accepted = Number(line.acceptedQuantity);
    if (!Number.isSafeInteger(received) || !Number.isSafeInteger(accepted) || received < 0 || accepted < 0) {
      return "Received and accepted quantities must be whole numbers of zero or more.";
    }
    if (received > item.remainingQuantity) return "A received quantity cannot exceed the remaining purchase order quantity.";
    if (accepted > received) return "Accepted quantity cannot exceed received quantity.";
    if (accepted < received && !String(line.rejectionReason || "").trim()) {
      return "Add a reason for any received quantity that is damaged or rejected.";
    }
    totalReceived += received;
  }

  if (seen.size !== itemById.size) return "Every purchase order line must appear exactly once.";
  if (totalReceived <= 0) return "Record at least one received item.";
  return null;
}

function createReceiptDraftId(cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.getRandomValues) throw new Error("This device cannot create a secure receipt draft identifier.");
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function receiptDraftStorageKey(userId, orderId) {
  if (!userId || !orderId) throw new Error("A signed-in user and purchase order are required for a local draft.");
  return `hovin.receipt.draft.v1:${encodeURIComponent(userId)}:${encodeURIComponent(orderId)}`;
}

module.exports = {
  createReceiptDraftLines,
  summarizeReceiptLine,
  validateReceiptDraft,
  createReceiptDraftId,
  receiptDraftStorageKey,
};
