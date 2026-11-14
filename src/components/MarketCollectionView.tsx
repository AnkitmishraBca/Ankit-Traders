import type { Ref } from "react";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  ImageIcon,
  PrinterIcon,
  RupeeIcon,
  SaveIcon,
  WalletIcon,
} from "@/components/icons";
import { StatementPaper, type StatementMemo } from "@/components/papers";
import {
  BusyOverlay,
  CountPill,
  EmptyState,
  FieldLabel,
  Panel,
  PanelHeading,
  SelectWrap,
  StatCard,
} from "@/components/ui";
import {
  daysInMonth,
  formatDay,
  formatDayUpper,
  formatINR,
  monthLabel,
  shortMonthLabel,
} from "@/lib/format";
import type { CollectionsResponse, DoctorRow } from "@/lib/types";

export type CollectionEntryDraft = {
  month: string;
  day: string;
  doctorId: string;
  amount: string;
  mode: string;
  notes: string;
};

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Credit"];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

type Props = {
  collections: CollectionsResponse;
  doctors: DoctorRow[];
  months: string[];
  entry: CollectionEntryDraft;
  savingEntry: boolean;
  savingDay: boolean;
  statementMode: "daily" | "monthly";
  statementMemo: StatementMemo;
  statementRef: Ref<HTMLElement>;
  registerScope: "all" | "month";
  dayDetailScope: "date" | "month";
  archiveOrder: "desc" | "asc";
  archiveYear: string;
  archiveActiveOnly: boolean;
  busyLabel: string | null;
  onEntryChange: (patch: Partial<CollectionEntryDraft>) => void;
  onFilterMonthChange: (month: string) => void;
  onFilterDateChange: (date: string) => void;
  onSaveEntry: () => void;
  onSaveDay: () => void;
  onDeleteEntry: (id: number) => void;
  onViewDay: (date: string) => void;
  onStatementMode: (mode: "daily" | "monthly") => void;
  onRegisterScope: (scope: "all" | "month") => void;
  onDayDetailScope: (scope: "date" | "month") => void;
  onArchiveOrder: () => void;
  onArchiveYear: (year: string) => void;
  onArchiveActiveOnly: () => void;
  onExport: (kind: "daily-pdf" | "daily-jpg" | "monthly-pdf" | "monthly-jpg") => void;
  onExportDay: (date: string, kind: "pdf" | "jpg") => void;
  onPrint: () => void;
  onGoInvoice: () => void;
  onAddDoctor: () => void;
};

export default function MarketCollectionView(props: Props) {
  const { collections, doctors, months, entry, statementMemo } = props;
  const selectedDoctor = doctors.find((row) => String(row.id) === entry.doctorId);
  const dayCount = daysInMonth(entry.month);
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const activeDays = collections.allDailySummaries.length;
  const dayTotal = Number(collections.selectedDateTotal || 0);
  const canSaveEntry = Boolean(entry.doctorId) && Number(entry.amount || 0) > 0;
  const registerRows =
    props.registerScope === "all"
      ? collections.allDailySummaries
      : collections.allDailySummaries.filter((row) => row.date.startsWith(collections.selectedMonth));
  const detailRows =
    props.dayDetailScope === "date" ? collections.dateEntries : collections.monthEntries;
  const years = Array.from(new Set(months.map((month) => month.slice(0, 4))));
  const archiveRows = months
    .map((month) => collections.monthlyTotals.find((row) => row.month === month))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .filter((row) => (props.archiveYear === "all" ? true : row.month.startsWith(props.archiveYear)))
    .filter((row) => (props.archiveActiveOnly ? row.entryCount > 0 : true))
    .sort((a, b) => (props.archiveOrder === "desc" ? -1 : 1) * a.month.localeCompare(b.month));

  return (
    <>
      <div className="page-stack">
        <div className="stats-grid">
          <StatCard
            label={`${monthLabel(collections.selectedMonth)} Collection`}
            value={formatINR(collections.monthlyTotal)}
            sub={`${collections.monthlyEntryCount} payments · ${collections.monthlyDoctorCount} doctors`}
            icon={<WalletIcon />}
          />
          <StatCard
            label={`Full Day Total (${formatDay(collections.selectedDate)})`}
            value={formatINR(collections.selectedDateTotal)}
            sub={`${collections.selectedDateDoctorCount} doctors · ${collections.selectedDateEntryCount} payments`}
            icon={<RupeeIcon />}
          />
          <StatCard
            label={`48-Month Total (${shortMonthLabel(firstMonth)} – ${shortMonthLabel(lastMonth)})`}
            value={formatINR(collections.allTime48MonthTotal)}
            sub={`${activeDays} active days`}
            icon={<CalendarIcon />}
          />
        </div>

        <div className="invoice-layout">
          <Panel className="builder-card">
            <PanelHeading
              title="Record Daily Collection"
              subtitle={`Choose any Month (${shortMonthLabel(firstMonth)} – ${shortMonthLabel(
                lastMonth,
              )}), Date (1–31), and Doctor from the dropdown lists — no manual typing required.`}
              chip="01"
            />

            <form
              onSubmit={(event) => {
                event.preventDefault();
                props.onSaveEntry();
              }}
            >
              <div className="collection-amount-grid">
                <div>
                  <FieldLabel
                    htmlFor="collection-entry-month"
                    hint={`· ${shortMonthLabel(firstMonth)} – ${shortMonthLabel(lastMonth)}`}
                  >
                    Month
                  </FieldLabel>
                  <SelectWrap>
                    <select
                      id="collection-entry-month"
                      className="input-control"
                      value={entry.month}
                      onChange={(event) => props.onEntryChange({ month: event.target.value })}
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {monthLabel(month)}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                </div>
                <div>
                  <FieldLabel htmlFor="collection-entry-date" hint="· all 30–31 days">
                    Date
                  </FieldLabel>
                  <SelectWrap>
                    <select
                      id="collection-entry-date"
                      className="input-control"
                      value={entry.day}
                      onChange={(event) => props.onEntryChange({ day: event.target.value })}
                    >
                      {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={`${day}`.padStart(2, "0")}>
                          {`${day}`.padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <FieldLabel htmlFor="collection-entry-doctor" hint="· select from saved doctors">
                  Doctor Name
                </FieldLabel>
                <SelectWrap>
                  <select
                    id="collection-entry-doctor"
                    className="input-control"
                    value={entry.doctorId}
                    onChange={(event) => props.onEntryChange({ doctorId: event.target.value })}
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

              <div
                className="doctor-picked"
                style={
                  selectedDoctor
                    ? undefined
                    : { borderStyle: "dashed", background: "rgb(251, 252, 250)" }
                }
              >
                <div className="doctor-picked-main">
                  <p
                    className="doctor-picked-name"
                    style={selectedDoctor ? undefined : { color: "rgb(104, 118, 108)" }}
                  >
                    {selectedDoctor
                      ? selectedDoctor.name
                      : "Choose a doctor from the dropdown above"}
                  </p>
                  <div className="doctor-picked-detail">
                    {selectedDoctor ? (
                      <>
                        <span>{selectedDoctor.address || "Address not saved"}</span>
                        <span>· {selectedDoctor.phone || "No phone"}</span>
                      </>
                    ) : (
                      <span>{doctors.length} doctors available in Master list</span>
                    )}
                  </div>
                </div>
                <button className="text-button" type="button" onClick={props.onAddDoctor}>
                  + Add Doctor
                </button>
              </div>

              <div className="divider" />

              <div className="collection-amount-grid">
                <div>
                  <FieldLabel htmlFor="collection-entry-amount">Collection Amount (₹)</FieldLabel>
                  <input
                    id="collection-entry-amount"
                    className="input-control"
                    type="number"
                    min={1}
                    max={9999999999.99}
                    step="0.01"
                    required
                    placeholder="Enter amount (e.g. 5000)"
                    value={entry.amount}
                    onChange={(event) => props.onEntryChange({ amount: event.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="collection-entry-mode">Payment Mode</FieldLabel>
                  <SelectWrap>
                    <select
                      id="collection-entry-mode"
                      className="input-control"
                      value={entry.mode}
                      onChange={(event) => props.onEntryChange({ mode: event.target.value })}
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                </div>
              </div>

              <div className="quick-amount-row" aria-label="Quick amount buttons">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="quick-amount-chip"
                    onClick={() =>
                      props.onEntryChange({
                        amount: String(
                          Math.round((Number(entry.amount || 0) + amount) * 100) / 100,
                        ),
                      })
                    }
                  >
                    +{formatINR(amount).replace(".00", "")}
                  </button>
                ))}
                {Number(entry.amount || 0) > 0 ? (
                  <button
                    type="button"
                    className="quick-amount-chip clear"
                    onClick={() => props.onEntryChange({ amount: "" })}
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div style={{ marginTop: 13 }}>
                <FieldLabel htmlFor="collection-entry-notes" hint="· optional">
                  Remarks / Reference
                </FieldLabel>
                <input
                  id="collection-entry-notes"
                  className="input-control"
                  maxLength={240}
                  placeholder="Optional note (e.g. Against pending invoice)"
                  value={entry.notes}
                  onChange={(event) => props.onEntryChange({ notes: event.target.value })}
                />
              </div>

              <button
                className="primary-button save-invoice"
                type="submit"
                disabled={!canSaveEntry || props.savingEntry}
              >
                <SaveIcon size={15} />
                {props.savingEntry ? "Saving…" : "Save Doctor Collection"}
              </button>
            </form>

            <div className="day-summary-box">
              <div className="day-summary-top">
                <div>
                  <span className="day-summary-eyebrow">
                    FULL DAY COLLECTION SUMMARY · {formatDayUpper(collections.selectedDate)}
                  </span>
                  <div className="day-summary-amount-row">
                    <strong>{formatINR(dayTotal)}</strong>
                    <span className="day-summary-meta">
                      from {collections.selectedDateDoctorCount} doctors (
                      {collections.selectedDateEntryCount} entries)
                    </span>
                  </div>
                  {collections.selectedDateIsSaved ? (
                    <div className="day-summary-meta" style={{ marginTop: 6 }}>
                      Day locked · saved {formatDay(collections.selectedDate)}
                      {collections.selectedDateNotes ? ` · ${collections.selectedDateNotes}` : ""}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="day-summary-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={collections.selectedDateEntryCount === 0 || props.savingDay}
                  onClick={props.onSaveDay}
                >
                  <CheckIcon size={15} />
                  {collections.selectedDateIsSaved ? "Day Saved ✓" : "Save Full Day Collection"}
                </button>
                <button
                  type="button"
                  className="download-button"
                  disabled={collections.selectedDateEntryCount === 0}
                  onClick={() => props.onExport("daily-pdf")}
                >
                  <DownloadIcon size={15} /> Day PDF (A5)
                </button>
                <button
                  type="button"
                  className="download-button"
                  disabled={collections.selectedDateEntryCount === 0}
                  onClick={() => props.onExport("daily-jpg")}
                >
                  <ImageIcon size={15} /> Day JPG (A5)
                </button>
                <button
                  type="button"
                  className="download-button"
                  onClick={props.onPrint}
                >
                  <PrinterIcon size={15} /> Print (A5)
                </button>
              </div>
            </div>
          </Panel>

          <Panel className="preview-card">
            <div className="preview-heading">
              <div>
                <h2>Collection Statement Preview</h2>
              </div>
              <div className="statement-mode-pills">
                <button
                  type="button"
                  className={`mode-pill ${props.statementMode === "daily" ? "active" : ""}`}
                  onClick={() => props.onStatementMode("daily")}
                >
                  Daily ({formatDay(collections.selectedDate)})
                </button>
                <button
                  type="button"
                  className={`mode-pill ${props.statementMode === "monthly" ? "active" : ""}`}
                  onClick={() => props.onStatementMode("monthly")}
                >
                  Monthly ({monthLabel(collections.selectedMonth)})
                </button>
              </div>
            </div>

            <div className="a5-preview-frame">
              <StatementPaper memo={statementMemo} paperRef={props.statementRef} />
            </div>

            <div className="export-actions-grid">
              <div className="export-group">
                <span className="export-group-label">
                  Full Day Sheet ({formatDay(collections.selectedDate)})
                </span>
                <div className="export-actions">
                  <button
                    className="download-button"
                    type="button"
                    onClick={() => props.onExport("daily-pdf")}
                  >
                    <DownloadIcon size={15} /> Daily PDF
                  </button>
                  <button
                    className="download-button"
                    type="button"
                    onClick={() => props.onExport("daily-jpg")}
                  >
                    <ImageIcon size={15} /> Daily JPG
                  </button>
                </div>
              </div>
              <div className="export-group">
                <span className="export-group-label">
                  Full Month Sheet ({monthLabel(collections.selectedMonth)})
                </span>
                <div className="export-actions">
                  <button
                    className="download-button"
                    type="button"
                    onClick={() => props.onExport("monthly-pdf")}
                  >
                    <DownloadIcon size={15} /> Monthly PDF
                  </button>
                  <button
                    className="download-button"
                    type="button"
                    onClick={() => props.onExport("monthly-jpg")}
                  >
                    <ImageIcon size={15} /> Monthly JPG
                  </button>
                </div>
              </div>
            </div>
            <p className="export-help">
              Download a formatted <b>A5 (148 × 210 mm)</b> PDF or JPG receipt sheet — rendered at
              300 DPI so text stays sharp and never faded — for any specific day or the entire month
              showing date, doctor name, and collected amount.
            </p>
          </Panel>
        </div>

        <Panel className="report-filter-card">
          <div className="report-filter-copy">
            <span className="stat-icon">
              <ClockIcon size={17} />
            </span>
            <div>
              <h2>
                Inspect Collection by Month &amp; Date ({shortMonthLabel(firstMonth)} –{" "}
                {shortMonthLabel(lastMonth)})
              </h2>
              <p>
                Select any month from {monthLabel(firstMonth)} through {monthLabel(lastMonth)} (48
                months) to view its total, then choose any date to see which doctor paid how much and
                the full day total.
              </p>
            </div>
          </div>
          <div className="collection-filter-controls">
            <div>
              <FieldLabel htmlFor="collection-report-month">Select Month (48 Months)</FieldLabel>
              <SelectWrap>
                <select
                  id="collection-report-month"
                  className="input-control"
                  value={collections.selectedMonth}
                  onChange={(event) => props.onFilterMonthChange(event.target.value)}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {monthLabel(month)}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </div>
            <div>
              <FieldLabel htmlFor="collection-report-date-select">
                Select Date in {monthLabel(collections.selectedMonth)}
              </FieldLabel>
              <SelectWrap>
                <select
                  id="collection-report-date-select"
                  className="input-control"
                  value={collections.selectedDate}
                  onChange={(event) => props.onFilterDateChange(event.target.value)}
                >
                  {Array.from(
                    { length: daysInMonth(collections.selectedMonth) },
                    (_, i) =>
                      `${collections.selectedMonth}-${`${i + 1}`.padStart(2, "0")}`,
                  ).map((date) => (
                    <option key={date} value={date}>
                      {formatDay(date)}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </div>
            <div>
              <FieldLabel htmlFor="collection-report-date-picker">Or Jump to Any Date</FieldLabel>
              <input
                id="collection-report-date-picker"
                className="input-control"
                type="date"
                min={`${firstMonth}-01`}
                max={`${lastMonth}-${daysInMonth(lastMonth)}`}
                value={collections.selectedDate}
                onChange={(event) => props.onFilterDateChange(event.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel className="history-card">
          <div className="history-toolbar">
            <div>
              <h2>Daily Collection Register (Day-by-Day Totals &amp; Doctors)</h2>
              <p>
                Inspect any day to see every doctor who paid, the full day&apos;s total collection,
                and download that day&apos;s A5 sheet as PDF or JPG.
              </p>
            </div>
            <div className="statement-mode-pills">
              <button
                type="button"
                className={`mode-pill ${props.registerScope === "all" ? "active" : ""}`}
                onClick={() => props.onRegisterScope("all")}
              >
                All Recorded Days ({collections.allDailySummaries.length})
              </button>
              <button
                type="button"
                className={`mode-pill ${props.registerScope === "month" ? "active" : ""}`}
                onClick={() => props.onRegisterScope("month")}
              >
                {monthLabel(collections.selectedMonth)} ({collections.dailyTotals.length})
              </button>
            </div>
          </div>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctors &amp; Rupees Paid</th>
                  <th>Full Day Total</th>
                  <th>Status</th>
                  <th>Download / Inspect</th>
                </tr>
              </thead>
              <tbody>
                {registerRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="history-items">
                      No collection recorded yet for this scope.
                    </td>
                  </tr>
                ) : (
                  registerRows.map((row) => (
                    <tr
                      key={row.date}
                      className={row.date === collections.selectedDate ? "selected-table-row" : ""}
                    >
                      <td className="invoice-number-cell">{formatDay(row.date)}</td>
                      <td className="day-doctors-cell">
                        <div className="day-doctors-chips">
                          {row.doctorsBreakdown.map((item) => (
                            <span className="doctor-amt-pill" key={`${row.date}-${item.id}`}>
                              {item.doctorName}: {formatINR(item.amount)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="history-amount">{formatINR(row.total)}</td>
                      <td>
                        <span className="mode-badge">
                          {row.isDaySaved ? "Day Saved ✓" : "Recorded"}
                        </span>
                      </td>
                      <td>
                        <div className="row-action-buttons">
                          <button
                            className="view-link"
                            type="button"
                            onClick={() => props.onViewDay(row.date)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="download-button"
                            onClick={() => props.onExportDay(row.date, "pdf")}
                          >
                            PDF
                          </button>
                          <button
                            type="button"
                            className="download-button"
                            onClick={() => props.onExportDay(row.date, "jpg")}
                          >
                            JPG
                          </button>
                          <button
                            type="button"
                            className="download-button"
                            onClick={() => props.onViewDay(row.date)}
                          >
                            <PrinterIcon size={14} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="report-detail-grid">
          <Panel className="history-card">
            <div className="history-toolbar">
              <div>
                <h2>{monthLabel(collections.selectedMonth)} · Date-wise Summary</h2>
                <p>
                  Month Total: <strong>{formatINR(collections.monthlyTotal)}</strong> · Click any
                  date to inspect who paid on that day
                </p>
              </div>
              <CountPill>{collections.dailyTotals.length}</CountPill>
            </div>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doctors</th>
                    <th>Full Day Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.dailyTotals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="history-items">
                        No collection in {monthLabel(collections.selectedMonth)}.
                      </td>
                    </tr>
                  ) : (
                    collections.dailyTotals.map((row) => (
                      <tr
                        key={row.date}
                        className={
                          row.date === collections.selectedDate ? "selected-table-row" : ""
                        }
                      >
                        <td className="invoice-number-cell">{formatDay(row.date)}</td>
                        <td>{row.doctorCount} doctor</td>
                        <td className="history-amount">{formatINR(row.total)}</td>
                        <td>
                          <button
                            className="view-link"
                            type="button"
                            onClick={() => props.onViewDay(row.date)}
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="history-card">
            <div className="history-toolbar">
              <div>
                <h2>
                  {props.dayDetailScope === "date"
                    ? `${formatDay(collections.selectedDate)} · Doctor Payments`
                    : `${monthLabel(collections.selectedMonth)} · Doctor Payments`}
                </h2>
                <p>
                  Full Total:{" "}
                  <strong>
                    {formatINR(
                      props.dayDetailScope === "date"
                        ? collections.selectedDateTotal
                        : collections.monthlyTotal,
                    )}
                  </strong>
                  · Date, Doctor Name &amp; Rupees Paid
                </p>
              </div>
              <div className="statement-mode-pills">
                <button
                  type="button"
                  className={`mode-pill ${props.dayDetailScope === "date" ? "active" : ""}`}
                  onClick={() => props.onDayDetailScope("date")}
                >
                  Selected Date ({collections.dateEntries.length})
                </button>
                <button
                  type="button"
                  className={`mode-pill ${props.dayDetailScope === "month" ? "active" : ""}`}
                  onClick={() => props.onDayDetailScope("month")}
                >
                  Full Month ({collections.monthEntries.length})
                </button>
              </div>
            </div>
            {detailRows.length === 0 ? (
              <EmptyState
                icon={<WalletIcon size={20} />}
                title={
                  props.dayDetailScope === "date"
                    ? `No payments recorded on ${formatDay(collections.selectedDate)}`
                    : `No payments recorded in ${monthLabel(collections.selectedMonth)}`
                }
                body="Pick another date from the dropdown or record a new payment for this date."
              />
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Mode</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.id}>
                        <td className="invoice-number-cell">{formatDay(row.collectionDate)}</td>
                        <td>{row.doctorName}</td>
                        <td>
                          <span className="mode-badge">{row.paymentMode}</span>
                        </td>
                        <td className="history-amount">{formatINR(row.amount)}</td>
                        <td>
                          <button
                            className="view-link"
                            type="button"
                            onClick={() => props.onDeleteEntry(row.id)}
                          >
                            Delete
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

        <Panel className="history-card">
          <div className="history-toolbar">
            <div>
              <h2>
                48-Month Market Collection Schedule ({shortMonthLabel(firstMonth)} –{" "}
                {shortMonthLabel(lastMonth)})
              </h2>
              <p>
                Browse monthly collection totals from {monthLabel(firstMonth)} through{" "}
                {monthLabel(lastMonth)}. Click any month to inspect its daily &amp; doctor-wise
                entries or download statements.
              </p>
            </div>
            <div className="archive-filter-controls">
              <button type="button" className="quiet-button" onClick={props.onArchiveOrder}>
                Order: {props.archiveOrder === "desc" ? "Newest → Oldest" : "Oldest → Newest"}
              </button>
              <select
                aria-label="Filter 48 months by year"
                className="input-control compact-select"
                value={props.archiveYear}
                onChange={(event) => props.onArchiveYear(event.target.value)}
              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`quiet-button ${props.archiveActiveOnly ? "active" : ""}`}
                onClick={props.onArchiveActiveOnly}
              >
                Active Months Only
              </button>
            </div>
          </div>
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Entries</th>
                  <th>Doctors</th>
                  <th>Total Collection</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {archiveRows.map((row) => (
                  <tr
                    key={row.month}
                    className={row.month === collections.selectedMonth ? "selected-table-row" : ""}
                  >
                    <td className="invoice-number-cell">{monthLabel(row.month)}</td>
                    <td>{row.entryCount}</td>
                    <td>{row.doctorCount}</td>
                    <td className="history-amount">{formatINR(row.total)}</td>
                    <td>
                      <button
                        className="view-link"
                        type="button"
                        onClick={() => props.onFilterMonthChange(row.month)}
                      >
                        {row.month === collections.selectedMonth ? "Active Month ✓" : "Inspect Month →"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

      </div>

      {props.busyLabel ? <BusyOverlay label={props.busyLabel} /> : null}
    </>
  );
}
