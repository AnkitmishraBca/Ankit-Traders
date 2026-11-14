import { CalendarIcon, ChevronIcon, ClockIcon, ReceiptIcon, RupeeIcon } from "@/components/icons";
import { BusyOverlay, CountPill, EmptyState, FieldLabel, Panel, StatCard } from "@/components/ui";
import {
  daysInMonth,
  formatDay,
  formatINR,
  monthLabel,
  shortMonthLabel,
} from "@/lib/format";
import type { InvoiceRow, ReportsResponse } from "@/lib/types";

type Props = {
  reports: ReportsResponse;
  months: string[];
  busyLabel: string | null;
  onMonthChange: (month: string) => void;
  onDateChange: (date: string) => void;
  onViewDay: (date: string) => void;
  onViewInvoice: (invoice: InvoiceRow) => void;
};

export default function ReportsView(props: Props) {
  const { reports, months } = props;
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const sortedMonths = [...reports.monthlyTotals].sort((a, b) => -a.month.localeCompare(b.month));

  return (
    <>
      <div className="page-stack">
        <Panel className="report-filter-card">
          <div className="report-filter-copy">
            <span className="stat-icon">
              <CalendarIcon size={17} />
            </span>
            <div>
              <h2>Select Billing Period</h2>
              <p>Records up to 48 months. Totals include invoice grand totals.</p>
            </div>
          </div>
          <div className="report-filters">
            <div>
              <FieldLabel htmlFor="report-month">Month</FieldLabel>
              <select
                id="report-month"
                className="input-control"
                value={reports.selectedMonth}
                onChange={(event) => props.onMonthChange(event.target.value)}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="report-date">Select Specific Date</FieldLabel>
              <input
                id="report-date"
                className="input-control"
                type="date"
                min={`${firstMonth}-01`}
                max={`${lastMonth}-${daysInMonth(lastMonth)}`}
                value={reports.selectedDate}
                onChange={(event) => props.onDateChange(event.target.value)}
              />
            </div>
          </div>
        </Panel>

        <div className="stats-grid report-stats-grid">
          <StatCard
            label={`${monthLabel(reports.selectedMonth)} Billing`}
            value={formatINR(reports.monthlyTotal)}
            sub={`${reports.monthlyInvoiceCount} bills`}
            icon={<RupeeIcon />}
          />
          <StatCard
            label={`${formatDay(reports.selectedDate)} Billing`}
            value={formatINR(reports.selectedDateTotal)}
            sub={`${reports.selectedDateInvoiceCount} bills`}
            icon={<ReceiptIcon />}
          />
          <StatCard label="Report Range" value={months.length} sub="months history" icon={<ClockIcon />} />
        </div>

        <Panel className="history-card">
          <div className="history-toolbar">
            <div>
              <h2>48-Month Billing Summary</h2>
              <p>
                Archive {shortMonthLabel(firstMonth)} – {shortMonthLabel(lastMonth)} · Click any month
                to inspect its day-by-day billing breakdown.
              </p>
            </div>
            <CountPill>{sortedMonths.length}</CountPill>
          </div>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Invoices</th>
                  <th>Total Billing</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map((row) => (
                  <tr
                    key={row.month}
                    className={row.month === reports.selectedMonth ? "selected-table-row" : ""}
                  >
                    <td className="invoice-number-cell">{monthLabel(row.month)}</td>
                    <td>{row.invoiceCount}</td>
                    <td className="history-amount">{formatINR(row.total)}</td>
                    <td>
                      <button
                        className="view-link"
                        type="button"
                        onClick={() => props.onMonthChange(row.month)}
                      >
                        View Daily <ChevronIcon size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="report-detail-grid">
          <Panel className="history-card">
            <div className="history-toolbar">
              <div>
                <h2>{monthLabel(reports.selectedMonth)} · Daily Billing</h2>
                <p>Grand total billed on each active date.</p>
              </div>
            </div>
            {reports.dailyTotals.length === 0 ? (
              <EmptyState
                title={`No Billing in ${monthLabel(reports.selectedMonth)}`}
                body="Change the month filter to inspect other invoices."
              />
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bills</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {reports.dailyTotals.map((row) => (
                      <tr
                        key={row.date}
                        className={row.date === reports.selectedDate ? "selected-table-row" : ""}
                      >
                        <td>{formatDay(row.date)}</td>
                        <td>{row.invoiceCount}</td>
                        <td className="history-amount">{formatINR(row.total)}</td>
                        <td>
                          <button
                            className="view-link"
                            type="button"
                            onClick={() => props.onViewDay(row.date)}
                          >
                            View Bills
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel className="history-card">
            <div className="history-toolbar">
              <div>
                <h2>Bills for {formatDay(reports.selectedDate)}</h2>
                <p>
                  Selected Date Total: <strong>{formatINR(reports.selectedDateTotal)}</strong>
                </p>
              </div>
              <CountPill>{reports.dateInvoices.length}</CountPill>
            </div>
            {reports.dateInvoices.length === 0 ? (
              <EmptyState
                title="No Bills on Selected Date"
                body="Change the month or date filter to inspect other invoices."
              />
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Doctor</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.dateInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="invoice-number-cell">{invoice.invoiceNo}</td>
                        <td>{invoice.doctorName}</td>
                        <td className="history-items">{invoice.items.length}</td>
                        <td className="history-amount">{formatINR(invoice.grandTotal)}</td>
                        <td>
                          <button
                            className="view-link"
                            type="button"
                            onClick={() => props.onViewInvoice(invoice)}
                          >
                            View / A5 Export
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {props.busyLabel ? <BusyOverlay label={props.busyLabel} /> : null}
    </>
  );
}
