import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Printer, Share2, X } from "lucide-react";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface PrintableReceiptProps {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  customerName?: string;
  currency?: string;
  storeName?: string;
  storeLines?: string[];
  transactionId?: string;
  date?: Date;
  initialAction?: "print" | "share";
  onClose: () => void;
}

const PrintableReceipt = ({
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  cashierName,
  customerName,
  currency = "NGN",
  storeName = "My Store",
  storeLines,
  transactionId,
  date,
  initialAction,
  onClose,
}: PrintableReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const initialActionRef = useRef<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "sharing" | "shared">("idle");
  const fallbackTransactionId = `TXN-${Date.now().toString(36).toUpperCase()}`;
  const txId = transactionId || fallbackTransactionId;
  const now = date ? new Date(date) : new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const methodLabel =
    paymentMethod === "card"
      ? "Credit / Debit Card"
      : paymentMethod === "cash"
      ? "Cash"
      : paymentMethod === "transfer"
      ? "Bank Transfer"
      : paymentMethod === "other"
      ? "Other"
      : "Other";

  const money = useMemo(() => {
    return (amount: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(Number.isFinite(amount) ? amount : 0);
  }, [currency]);

  const buildShareText = useCallback(() => {
    const lines: string[] = [];
    lines.push(String(storeName || "Store"));
    if (Array.isArray(storeLines) && storeLines.length) {
      for (const l of storeLines) {
        const s = String(l || "").trim();
        if (s) lines.push(s);
      }
    }
    lines.push(`Receipt: ${txId}`);
    lines.push(`Date: ${dateStr} ${timeStr}`);
    if (customerName) lines.push(`Customer: ${customerName}`);
    if (cashierName) lines.push(`Cashier: ${cashierName}`);
    lines.push(`Paid with: ${methodLabel}`);
    lines.push("");
    lines.push("Items:");
    for (const i of items) {
      lines.push(`- ${i.name} x${i.quantity} @ ${money(i.price)} = ${money(i.price * i.quantity)}`);
    }
    lines.push("");
    lines.push(`Subtotal: ${money(subtotal)}`);
    lines.push(`Tax: ${money(tax)}`);
    lines.push(`Total: ${money(total)}`);
    return lines.join("\n");
  }, [cashierName, customerName, dateStr, items, methodLabel, money, storeLines, storeName, subtotal, tax, timeStr, total, txId]);

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; width: 58mm; margin: 0; padding: 4mm; color: #000; background: #fff; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          .row { display: flex; justify-content: space-between; font-size: 10pt; line-height: 1.2; margin-bottom: 1mm; }
          .item-name { font-size: 10pt; font-weight: bold; }
          .item-detail { font-size: 9pt; margin-bottom: 2mm; }
          .store-name { font-size: 12pt; font-weight: bold; margin-bottom: 1mm; }
          .meta { font-size: 9pt; line-height: 1.2; margin-bottom: 1mm; }
          .total-row { font-size: 11pt; font-weight: bold; margin-top: 2mm; }
          .footer { font-size: 9pt; margin-top: 4mm; text-align: center; }
          @media print { 
            body { width: 58mm; padding: 2mm; }
            @page { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, []);

  const handleShare = useCallback(async () => {
    if (shareStatus === "sharing") return;
    setShareStatus("sharing");
    try {
      const text = buildShareText();
      const nav: any = navigator as any;
      if (nav?.share) {
        await nav.share({ title: `Receipt ${txId}`, text });
        setShareStatus("shared");
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        setShareStatus("shared");
        return;
      }
      window.prompt("Copy receipt text:", text);
      setShareStatus("shared");
    } catch {
      setShareStatus("idle");
    }
  }, [buildShareText, shareStatus, txId]);

  useEffect(() => {
    if (!initialAction) return;
    if (initialActionRef.current === initialAction) return;
    initialActionRef.current = initialAction;
    if (initialAction === "print") {
      setTimeout(() => handlePrint(), 50);
      return;
    }
    if (initialAction === "share") {
      void handleShare();
    }
  }, [handlePrint, handleShare, initialAction]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-card-foreground">Receipt Preview</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div
            ref={receiptRef}
            className="bg-white text-black rounded-lg p-5 font-mono text-xs shadow-inner"
          >
            {/* Store Info */}
            <div className="center" style={{ textAlign: "center" }}>
              <div className="store-name" style={{ fontSize: 16, fontWeight: "bold", marginBottom: 2 }}>
                {storeName}
              </div>
              <div className="meta" style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
                {Array.isArray(storeLines) && storeLines.length ? (
                  storeLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))
                ) : null}
              </div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Transaction Info */}
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date: {dateStr}</span>
                <span>{timeStr}</span>
              </div>
              <div>ID: {txId}</div>
              {customerName ? <div>Customer: {customerName}</div> : null}
              {cashierName ? <div>Cashier: {cashierName}</div> : null}
              <div>Payment: {methodLabel}</div>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Items */}
            {items.map((item, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <div className="item-name" style={{ fontSize: 12, lineHeight: 1.4 }}>{item.name}</div>
                <div
                  className="row item-detail"
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666" }}
                >
                  <span>
                    {item.quantity} x {money(item.price)}
                  </span>
                  <span>{money(item.quantity * item.price)}</span>
                </div>
              </div>
            ))}

            <div className="divider" style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Totals */}
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: 1.6 }}>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: 1.6 }}>
              <span>Tax</span>
              <span>{money(tax)}</span>
            </div>
            <div className="divider" style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />
            <div
              className="row total-row"
              style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: "bold" }}
            >
              <span>TOTAL</span>
              <span>{money(total)}</span>
            </div>

            <div className="divider" style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Footer */}
            <div className="footer" style={{ fontSize: 11, color: "#666", marginTop: 12, textAlign: "center" }}>
              Thank you for your purchase!<br />
              Returns accepted within 30 days<br />
              with original receipt.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => void handleShare()}
            className="flex-1 h-10 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            {shareStatus === "shared" ? "Copied" : shareStatus === "sharing" ? "Sharing…" : "Share"}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;
