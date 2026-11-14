import { ClockIcon, DownloadIcon } from "@/components/icons";
import { CountPill, EmptyState, Panel } from "@/components/ui";
import { formatDay, formatINR } from "@/lib/format";
import type { InvoiceRow } from "@/lib/types";

type Props = {
  invoices: InvoiceRow[];
  onView: (invoice: InvoiceRow) => void;
};

export default function HistoryView({ invoices, onView }: Props) {
  return (
    <Panel className="history-card">
      <div className="history-toolbar">
        <div>
          <h2>Saved Invoices</h2>
          <p>Recent invoices · Click View / Download to export A5 PDF or JPG</p>
        </div>
        <CountPill>{invoices.length}</CountPill>
      </div>
      {invoices.length === 0 ? (
        <EmptyState
          icon={<ClockIcon size={20} />}
          title="No Invoices Saved Yet"
          body="Create an invoice from the Create Invoice tab — it will appear here with A5 PDF, JPG and print downloads."
        />
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Items</th>
                <th>Grand Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="invoice-number-cell">{invoice.invoiceNo}</td>
                  <td>{formatDay(invoice.createdAt.slice(0, 10))}</td>
                  <td>{invoice.doctorName}</td>
                  <td className="history-items">
                    {invoice.items.length} medicine{invoice.items.length === 1 ? "" : "s"}
                  </td>
                  <td className="history-amount">{formatINR(invoice.grandTotal)}</td>
                  <td>
                    <button className="view-link" type="button" onClick={() => onView(invoice)}>
                      <DownloadIcon size={14} /> View / Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
