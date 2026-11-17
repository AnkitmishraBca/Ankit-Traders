import type { ReactNode, Ref } from "react";
import { formatINR } from "@/lib/format";

export type MemoLine = {
  key: string;
  title: string;
  sub?: string;
  amount: number;
};

export type InvoiceMemo = {
  invoiceNo?: string | null;
  dateLabel: string;
  doctorName: string;
  doctorAddress?: string;
  doctorPhone?: string;
  lines: MemoLine[];
  itemsTotal: number;
  backDues: number;
  grandTotal: number;
  emptyText?: string;
};

export type StatementMemo = {
  docType: string;
  numberTop: string;
  numberBottom: string;
  dateHeading: string;
  dateLabel: string;
  metaLabel: string;
  total: number;
  lines: MemoLine[];
  totalLabel: string;
  emptyText: string;
};

type PaperProps = {
  a5?: boolean;
  paperRef?: Ref<HTMLElement>;
  ariaLabel?: string;
};

function BrandRow({
  docType,
  numberTop,
  numberBottom,
}: {
  docType: string;
  numberTop: ReactNode;
  numberBottom: string;
}) {
  return (
    <div className="paper-brand-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Ankit Traders logo"
        className="paper-logo"
        src="/images/ankit-traders-logo.jpg"
        loading="eager"
        decoding="sync"
      />
      <div className="paper-brand-text">
        <h2 className="paper-company-title">ANKIT TRADERS</h2>
        <p className="paper-company-sub">HERBAL PRODUCTS</p>
        <p className="paper-company-address">Barkagoan Mansingh Patti</p>
        <p className="paper-company-phone">Phone: 8002408341, 7488400482</p>
      </div>
      <div className="paper-doc-meta">
        <div className="paper-doc-type">{docType}</div>
        <div className="paper-doc-number">
          {numberTop}
          <br />
          {numberBottom}
        </div>
      </div>
    </div>
  );
}

function Lines({ lines, emptyText }: { lines: MemoLine[]; emptyText: string }) {
  return (
    <div className="paper-lines">
      {lines.length === 0 ? (
        <div className="paper-empty">{emptyText}</div>
      ) : (
        lines.map((line) => (
          <div className="paper-line premium-line" key={line.key}>
            <span className="paper-line-main">
              <span className="paper-medicine-title">{line.title}</span>
              {line.sub ? <small>{line.sub}</small> : null}
            </span>
            <span className="paper-rupee-amount">{formatINR(line.amount)}</span>
          </div>
        ))
      )}
    </div>
  );
}

function PaperFooter() {
  return (
    <div className="paper-footer premium-footer">
      <span>Thank you! Visit again.</span>
    </div>
  );
}

function PaperShell({
  a5,
  paperRef,
  ariaLabel,
  docType,
  numberTop,
  numberBottom,
  children,
}: PaperProps & {
  docType: string;
  numberTop: ReactNode;
  numberBottom: string;
  children: ReactNode;
}) {
  return (
    <article
      ref={paperRef as Ref<HTMLElement>}
      className={`invoice-paper premium-paper${a5 ? " a5-paper" : ""}`}
      aria-label={ariaLabel}
    >
      <div className="paper-accent" />
      <div className="paper-gold-line" />
      <div className="paper-inner">
        <BrandRow docType={docType} numberTop={numberTop} numberBottom={numberBottom} />
        {children}
        <PaperFooter />
      </div>
    </article>
  );
}

export function InvoicePaper({
  memo,
  a5 = false,
  paperRef,
  ariaLabel = "Cash Memo preview",
}: PaperProps & { memo: InvoiceMemo }) {
  const cleanLines: MemoLine[] = memo.lines.map((line) => ({
    key: line.key,
    title: line.title,
    amount: line.amount,
  }));

  return (
    <PaperShell
      a5={a5}
      paperRef={paperRef}
      ariaLabel={ariaLabel}
      docType="CASH / CREDIT MEMO"
      numberTop={memo.invoiceNo || "Draft Bill"}
      numberBottom={memo.dateLabel}
    >
      <div className="paper-doctor-card">
        <p className="paper-billed-to">BILLED TO</p>
        <p className="paper-doctor-name">{memo.doctorName || "Select a Doctor"}</p>
        {memo.doctorAddress || memo.doctorPhone ? (
          <div className="paper-contact">
            {memo.doctorAddress || ""}
            {memo.doctorAddress && memo.doctorPhone ? <br /> : null}
            {memo.doctorPhone ? `Phone: ${memo.doctorPhone}` : ""}
          </div>
        ) : null}
      </div>

      <div className="paper-table-head">
        <span>QTY &amp; MEDICINE</span>
        <span>AMOUNT</span>
      </div>

      <Lines
        lines={cleanLines}
        emptyText={
          memo.emptyText ?? "Select medicines and quantities (1–300) to add them to this Cash Memo"
        }
      />

      <div className="paper-rule" />
      <div className="paper-total-row">
        <span>Items Subtotal:</span>
        <span className="paper-rupee-amount">{formatINR(memo.itemsTotal)}</span>
      </div>
      <div className="paper-total-row">
        <span>Previous Back Dues:</span>
        <span className="paper-rupee-amount">{formatINR(memo.backDues)}</span>
      </div>
      <div className="paper-rule paper-rule-dashed" />
      <div className="paper-total-row paper-grand-row">
        <span>Grand Total:</span>
        <span className="paper-rupee-amount paper-rupee-grand">{formatINR(memo.grandTotal)}</span>
      </div>
    </PaperShell>
  );
}

export function StatementPaper({
  memo,
  a5 = false,
  paperRef,
  ariaLabel = "Market collection statement preview",
}: PaperProps & { memo: StatementMemo }) {
  return (
    <PaperShell
      a5={a5}
      paperRef={paperRef}
      ariaLabel={ariaLabel}
      docType={memo.docType}
      numberTop={memo.numberTop}
      numberBottom={memo.numberBottom}
    >
      <div className="paper-doctor-card collection-summary-strip">
        <div>
          <p className="paper-billed-to">{memo.dateHeading}</p>
          <p className="paper-doctor-name">{memo.dateLabel}</p>
          <div className="paper-contact">{memo.metaLabel}</div>
        </div>
        <div className="collection-paper-total-badge">
          <span>FULL COLLECTION TOTAL</span>
          <strong>{formatINR(memo.total)}</strong>
        </div>
      </div>

      <div className="paper-table-head collection-table-head">
        <span>DATE · DOCTOR NAME</span>
        <span>COLLECTION</span>
      </div>

      <Lines lines={memo.lines} emptyText={memo.emptyText} />

      <div className="paper-rule paper-rule-dashed" />
      <div className="paper-total-row paper-grand-row">
        <span>{memo.totalLabel}</span>
        <span className="paper-rupee-amount paper-rupee-grand">{formatINR(memo.total)}</span>
      </div>
    </PaperShell>
  );
}
