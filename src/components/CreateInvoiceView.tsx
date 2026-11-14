import type { Ref } from "react";
import {
  ArrowRightIcon,
  DownloadIcon,
  ImageIcon,
  PillIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptIcon,
  RupeeIcon,
  SaveIcon,
  ShareIcon,
  SparkleIcon,
  TrashIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { InvoicePaper, type InvoiceMemo } from "@/components/papers";
import {
  BusyOverlay,
  FieldLabel,
  Panel,
  PanelHeading,
  SelectWrap,
  StatCard,
} from "@/components/ui";
import { formatINR, round2 } from "@/lib/format";
import type { DoctorRow, MedicineRow } from "@/lib/types";

export type InvoiceLineState = {
  uid: string;
  medicineId: string;
  quantity: number;
  discount: number;
};

const DISCOUNTS = Array.from({ length: 31 }, (_, i) => 30 + i);
const QUANTITIES = Array.from({ length: 300 }, (_, i) => i + 1);

export function lineTotals(line: InvoiceLineState, medicines: MedicineRow[]) {
  const medicine = medicines.find((row) => String(row.id) === line.medicineId);
  const mrp = Number(medicine?.mrp ?? 0);
  const unitRate = round2(mrp * (1 - line.discount / 100));
  const lineTotal = round2(unitRate * line.quantity);
  return { medicine, mrp, unitRate, lineTotal };
}

type Props = {
  doctors: DoctorRow[];
  medicines: MedicineRow[];
  monthBilling: number;
  monthInvoiceCount: number;
  marketTotal: number;
  marketMonthLabel: string;
  doctorId: string;
  discount: number;
  backDues: string;
  lines: InvoiceLineState[];
  memo: InvoiceMemo;
  canSave: boolean;
  saving: boolean;
  savedInvoiceNo: string | null;
  busyLabel: string | null;
  previewRef: Ref<HTMLElement>;
  onDoctorChange: (value: string) => void;
  onDiscountChange: (value: number) => void;
  onBackDuesChange: (value: string) => void;
  onLineChange: (uid: string, patch: Partial<InvoiceLineState>) => void;
  onAddLine: () => void;
  onRemoveLine: (uid: string) => void;
  onSave: () => void;
  onDownloadPdf: () => void;
  onDownloadJpg: () => void;
  onPrint: () => void;
  onGoCollection: () => void;
  onGoMasters: () => void;
  onNewBill: () => void;
  onShare: () => void;
};

export default function CreateInvoiceView(props: Props) {
  const {
    doctors,
    medicines,
    monthBilling,
    monthInvoiceCount,
    marketTotal,
    marketMonthLabel,
    doctorId,
    discount,
    backDues,
    lines,
    memo,
    canSave,
    saving,
    savedInvoiceNo,
    busyLabel,
    previewRef,
  } = props;

  const doctor = doctors.find((row) => String(row.id) === doctorId);
  const pieces = lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
  const itemsTotal = round2(
    lines.reduce((sum, line) => sum + lineTotals(line, medicines).lineTotal, 0),
  );
  const canExport = Boolean(doctor) && lines.some((line) => line.medicineId);
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  return (
    <>
      <div className="page-stack">
        <div className="stats-grid stats-grid-4">
          <StatCard
            label="This Month's Billing"
            value={formatINR(monthBilling)}
            sub={`${monthInvoiceCount} invoices`}
            icon={<RupeeIcon />}
          />
          <StatCard
            label="Market Collection"
            value={formatINR(marketTotal)}
            sub={`${marketMonthLabel} →`}
            icon={<WalletIcon size={17} />}
            onClick={props.onGoCollection}
          />
          <StatCard
            label="Saved Doctors"
            value={doctors.length}
            sub="in master list"
            icon={<UsersIcon size={16} />}
          />
          <StatCard
            label="Saved Medicines"
            value={medicines.length}
            sub="in catalog"
            icon={<PillIcon />}
          />
        </div>

        <div className="sample-banner fresh-banner">
          <div className="sample-copy">
            <span className="sample-icon">
              <SparkleIcon size={18} />
            </span>
            <div>
              <strong>Effortless Dropdown Billing · Select Doctor, Medicine &amp; Quantity Without Typing</strong>
              <p>
                Choose quantities from <b>1 to 300</b> directly from the dropdown list, or open{" "}
                <b>Market Collection</b> to log daily doctor payments.
              </p>
            </div>
          </div>
          <div className="fresh-banner-actions">
            <button className="secondary-button" type="button" onClick={props.onGoCollection}>
              <WalletIcon size={14} /> Market Collection
            </button>
            <button className="secondary-button" type="button" onClick={props.onGoMasters}>
              <PlusIcon size={14} /> Add Masters
            </button>
            <button className="secondary-button" type="button" onClick={props.onShare}>
              <ArrowRightIcon size={14} /> Share App Link
            </button>
          </div>
        </div>

        <div className="invoice-layout">
          <Panel className="builder-card">
            <PanelHeading
              title="Invoice Details"
              subtitle="Choose a doctor first, then add medicines and select quantities."
              chip="01"
            />

            <div className="invoice-top-selects">
              <div>
                <FieldLabel htmlFor="doctor-select" hint="· select from saved list">
                  Doctor Name
                </FieldLabel>
                <SelectWrap>
                  <select
                    id="doctor-select"
                    className="input-control"
                    value={doctorId}
                    onChange={(event) => props.onDoctorChange(event.target.value)}
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </SelectWrap>
              </div>
              <div>
                <FieldLabel htmlFor="invoice-discount-select" hint="· 30% to 60%">
                  Discount (%)
                </FieldLabel>
                <SelectWrap>
                  <select
                    id="invoice-discount-select"
                    className="input-control"
                    value={discount}
                    onChange={(event) => props.onDiscountChange(Number(event.target.value))}
                  >
                    {DISCOUNTS.map((value) => (
                      <option key={value} value={value}>
                        {value}% Less
                      </option>
                    ))}
                  </select>
                </SelectWrap>
              </div>
            </div>

            <div
              className="doctor-picked"
              style={
                doctor
                  ? undefined
                  : { borderStyle: "dashed", background: "rgb(251, 252, 250)" }
              }
            >
              <div className="doctor-picked-main">
                <p
                  className="doctor-picked-name"
                  style={doctor ? undefined : { color: "rgb(104, 118, 108)" }}
                >
                  {doctor ? doctor.name : "Doctor contact details will appear here"}
                </p>
                <div className="doctor-picked-detail">
                  {doctor ? (
                    <>
                      <span>{doctor.address || "Address not saved"}</span>
                      <span>· {doctor.phone || "No phone"}</span>
                    </>
                  ) : (
                    <span>{doctors.length} doctors saved in Master</span>
                  )}
                </div>
              </div>
              {doctor ? (
                <span className="discount-pill">{discount}% Less Applied</span>
              ) : (
                <button className="text-button" type="button" onClick={props.onGoMasters}>
                  + Add Doctor
                </button>
              )}
            </div>

            <div className="divider" />

            <div className="items-heading">
              <div>
                <h3>Medicines</h3>
                <p>Select medicine, quantity (1–300), and discount (30%–60%) from dropdowns.</p>
              </div>
              <span className="step-chip">02</span>
            </div>

            <div className="line-list">
              {lines.map((line, index) => {
                const { medicine, mrp, unitRate, lineTotal } = lineTotals(line, medicines);
                return (
                  <div className="line-row line-row-with-disc" key={line.uid}>
                    <div className="line-med-col">
                      <FieldLabel htmlFor={`medicine-${index + 1}`}>Medicine</FieldLabel>
                      <select
                        id={`medicine-${index + 1}`}
                        className="input-control"
                        value={line.medicineId}
                        onChange={(event) =>
                          props.onLineChange(line.uid, { medicineId: event.target.value })
                        }
                      >
                        <option value="">Select a medicine</option>
                        {medicines.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="line-qty-col">
                      <FieldLabel htmlFor={`qty-${index + 1}`}>Qty (1–300)</FieldLabel>
                      <select
                        id={`qty-${index + 1}`}
                        className="input-control qty-control"
                        value={line.quantity}
                        onChange={(event) =>
                          props.onLineChange(line.uid, { quantity: Number(event.target.value) })
                        }
                      >
                        {QUANTITIES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="line-disc-col">
                      <FieldLabel htmlFor={`disc-${index + 1}`}>Less (%)</FieldLabel>
                      <select
                        id={`disc-${index + 1}`}
                        className="input-control qty-control"
                        value={line.discount}
                        onChange={(event) =>
                          props.onLineChange(line.uid, { discount: Number(event.target.value) })
                        }
                      >
                        {DISCOUNTS.map((value) => (
                          <option key={value} value={value}>
                            {value}%
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row-price" aria-live="polite">
                      <strong>{formatINR(lineTotal)}</strong>
                      <span>
                        {medicine ? `MRP ${formatINR(mrp)} · ${line.discount}%` : "Select medicine"}
                        {medicine ? ` · ${formatINR(unitRate)}/pc` : ""}
                      </span>
                    </div>
                    <button
                      className="remove-row"
                      type="button"
                      aria-label="Remove medicine row"
                      onClick={() => props.onRemoveLine(line.uid)}
                      disabled={lines.length === 1}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button className="add-line" type="button" onClick={props.onAddLine}>
              <PlusIcon size={15} /> Add Another Medicine
            </button>

            <div className="discount-note">
              <SparkleIcon size={14} />
              Select any discount percentage from 30% to 60% directly from the dropdown — net amount
              calculates automatically.
            </div>

            <div className="totals-box totals-main">
              <div className="totals-breakdown">
                <div className="totals-breakdown-row">
                  <span>Items Subtotal · {pieces} pcs</span>
                  <strong>{formatINR(itemsTotal)}</strong>
                </div>
                <div className="totals-breakdown-row">
                  <label htmlFor="invoice-back-dues">Previous Back Dues (₹)</label>
                  <input
                    id="invoice-back-dues"
                    className="input-control back-dues-input"
                    type="number"
                    min={0}
                    max={9999999999.99}
                    step="0.01"
                    value={backDues}
                    onChange={(event) => props.onBackDuesChange(event.target.value)}
                  />
                </div>
              </div>
              <div className="totals-meta">
                <span>Grand Total</span>
                <strong>{formatINR(memo.grandTotal)}</strong>
              </div>
            </div>

            <button
              className="primary-button save-invoice"
              type="button"
              disabled={!canSave || saving}
              onClick={props.onSave}
            >
              <SaveIcon size={15} /> {saving ? "Saving…" : "Save Invoice"}
            </button>
            <p className="form-hint">
              {savedInvoiceNo
                ? `Invoice ${savedInvoiceNo} saved in Invoice History · A5 PDF, JPG and print ready.`
                : "Once saved, the invoice is stored in Invoice History and ready for A5 PDF or JPG download."}
            </p>
          </Panel>

          <Panel className="preview-card">
            <div className="preview-heading">
              <h2>Invoice Preview</h2>
              <span className="live-badge">
                <span className="live-dot" /> Live Preview · A5
              </span>
            </div>

            <div className="a5-preview-frame">
              <InvoicePaper memo={memo} paperRef={previewRef} />
            </div>

            <div className="export-actions" style={{ marginTop: 14 }}>
              <button
                className="download-button"
                type="button"
                disabled={!canExport}
                onClick={props.onDownloadPdf}
              >
                <DownloadIcon size={15} /> Download PDF (A5)
              </button>
              <button
                className="download-button"
                type="button"
                disabled={!canExport}
                onClick={props.onDownloadJpg}
              >
                <ImageIcon size={15} /> Download JPG (A5)
              </button>
              <button
                className="download-button"
                type="button"
                disabled={!canExport}
                onClick={props.onPrint}
              >
                <PrinterIcon size={15} /> Print Cash Memo (A5)
              </button>
            </div>
            <p className="export-help">
              Every export is generated on exact <b>A5 paper (148 × 210 mm)</b> at{" "}
              <b>300 DPI</b> — sharp text, solid colours, never faded. Print dialog opens with A5
              page size and zero margins selected automatically.
            </p>
          </Panel>
        </div>

        <Panel className="share-card">
          <div className="share-copy">
            <span className="stat-icon">
              <ReceiptIcon size={17} />
            </span>
            <div>
              <h2>Install on Mobile Phone</h2>
              <p>
                1) Copy and share the app link via WhatsApp · 2) Open the link in Chrome on your
                mobile phone · 3) Tap ⋮ → <b>Add to Home screen</b> → Install. Launch directly from
                your home screen and download A5 PDF/JPG invoices and collection reports on mobile.
              </p>
            </div>
          </div>
          <div className="share-actions">
            <button className="primary-button" type="button" onClick={props.onShare}>
              <ShareIcon size={15} /> Copy / Share App Link
            </button>
            <a
              className="secondary-button"
              href={`https://wa.me/?text=${encodeURIComponent(
                `Open Ankit Traders Billing & Market Collection App ${shareUrl}`.trim(),
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <ShareIcon size={15} /> Share on WhatsApp
            </a>
          </div>
        </Panel>
      </div>

      {busyLabel ? <BusyOverlay label={busyLabel} /> : null}
    </>
  );
}
