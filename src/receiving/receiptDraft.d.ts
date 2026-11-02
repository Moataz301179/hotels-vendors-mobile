export interface ReceiptOrderItem {
  id: string;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
}

export interface ReceiptOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentGuaranteed: boolean;
  estimatedDelivery: string | null;
  currency: string;
  canRecordReceipt: boolean;
  items: ReceiptOrderItem[];
}

export interface ReceiptLineDraft {
  orderItemId: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  reviewed: boolean;
  rejectionReason: string;
  conditionNotes: string;
}

export interface LocalReceiptDraft {
  id: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  updatedAt: string;
  lines: ReceiptLineDraft[];
  evidenceUris: string[];
  state: "LOCAL_DRAFT";
}

export function createReceiptDraftLines(order: ReceiptOrder): ReceiptLineDraft[];
export function summarizeReceiptLine(
  item: ReceiptOrderItem,
  line: ReceiptLineDraft
): { missingQuantity: number | null; damagedOrRejectedQuantity: number | null };
export function validateReceiptDraft(order: ReceiptOrder, lines: ReceiptLineDraft[]): string | null;
export function createReceiptDraftId(cryptoApi?: Crypto): string;
export function receiptDraftStorageKey(userId: string, orderId: string): string;
