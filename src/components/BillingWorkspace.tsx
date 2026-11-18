"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CatalogueView, { CatalogueBookIcon } from "@/components/CatalogueView";
import CreateInvoiceView, {
  lineTotals,
  type InvoiceLineState,
} from "@/components/CreateInvoiceView";
import HistoryView from "@/components/HistoryView";
import MarketCollectionView, { type CollectionEntryDraft } from "@/components/MarketCollectionView";
import MastersView from "@/components/MastersView";
import ReportsView from "@/components/ReportsView";
import {
  CalendarIcon,
  CloseIcon,
  ClockIcon,
  DownloadIcon,
  ImageIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { InvoicePaper, StatementPaper, type InvoiceMemo, type StatementMemo } from "@/components/papers";
import { Toast } from "@/components/ui";
import { exportA5Jpg, exportA5Pdf, printA5Sheet } from "@/lib/export-a5";
import {
  addMonths,
  build48Months,
  formatDay,
  formatINR,
  monthKey,
  monthLabel,
  round2,
  todayISO,
} from "@/lib/format";
import type {
  CollectionsResponse,
  DoctorRow,
  InvoiceRow,
  MedicineRow,
  ReportsResponse,
  TabKey,
} from "@/lib/types";

export type InitialData = {
  doctors: DoctorRow[];
  medicines: MedicineRow[];
  invoices: InvoiceRow[];
  collections: CollectionsResponse;
  reports: ReportsResponse;
  minimumMonth: string;
};

type ToastState = { message: string; tone: "ok" | "error" } | null;

function makeUid() {
  return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clientWindow(minimumMonth: string): string[] {
  const months = build48Months(minimumMonth);
  const current = monthKey();
  let cursor = addMonths(months[months.length - 1], 1);
  while (cursor <= current && months.length < 120) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

const TAB_META: Record<
  TabKey,
  { label: string; eyebrow: string; title: string; subtitle: string }
> = {
  invoice: {
    label: "Create Invoice",
    eyebrow: "Welcome, MR · Fast Wholesale Herbal Billing",
    title: "Create New Invoice",
    subtitle:
      "Select a doctor and add herbal medicines — discounts and totals calculate automatically.",
  },
  collection: {
    label: "Market Collection",
    eyebrow: "Daily Collection Ledger · 48-Month Archive & Statements",
    title: "Market Collection",
    subtitle:
      "Record daily collections using date and doctor dropdowns, inspect any month up to 48 months, and export A5 PDF or JPG statements.",
  },
  catalogue: {
    label: "Catalogue",
    eyebrow: "SB Herbals · Complete Product Catalogue",
    title: "Product Catalogue",
    subtitle:
      "Search any herbal product, disease, or category instantly — or scroll through all 42 HD catalogue pages.",
  },
  masters: {
    label: "Doctors & Medicines",
    eyebrow: "Master Catalog · Configure Once, Bill Effortlessly",
    title: "Doctors & Medicines",
    subtitle: "Manage each doctor's details and every product's retail price.",
  },
  history: {
    label: "Invoice History",
    eyebrow: "Saved Records · Complete Billing Archive",
    title: "Invoice History",
    subtitle: "Inspect previously saved invoices and download A5 PDF or JPG copies anytime.",
  },
  reports: {
    label: "Billing Reports",
    eyebrow: "Billing Analytics · 48-Month Archive",
    title: "Billing Reports",
    subtitle: "Month-wise and date-wise billing totals with drill-down to every invoice.",
  },
};

const NAV_ICONS: Record<TabKey, React.ReactNode> = {
  invoice: <ReceiptIcon />,
  collection: <WalletIcon />,
  catalogue: <CatalogueBookIcon />,
  masters: <UsersIcon />,
  history: <ClockIcon />,
  reports: <CalendarIcon />,
};

export default function BillingWorkspace({ initial }: { initial: InitialData }) {
  const [tab, setTab] = useState<TabKey>("invoice");
  const [doctors, setDoctors] = useState<DoctorRow[]>(initial.doctors);
  const [medicines, setMedicines] = useState<MedicineRow[]>(initial.medicines);
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initial.invoices);
  const [collections, setCollections] = useState<CollectionsResponse>(initial.collections);
  const [reports, setReports] = useState<ReportsResponse>(initial.reports);
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [savingDay, setSavingDay] = useState(false);

  const months = useMemo(() => clientWindow(initial.minimumMonth), [initial.minimumMonth]);

  /* ------------------------------ invoice draft --------------------------- */
  const [doctorId, setDoctorId] = useState("");
  const [discount, setDiscount] = useState(30);
  const [backDues, setBackDues] = useState("0");
  const [lines, setLines] = useState<InvoiceLineState[]>([
    { uid: makeUid(), medicineId: "", quantity: 1, discount: 30 },
  ]);
  const [savedInvoice, setSavedInvoice] = useState<InvoiceRow | null>(null);
  const [modalInvoice, setModalInvoice] = useState<InvoiceRow | null>(null);

  /* ---------------------------- collection draft -------------------------- */
  const [entry, setEntry] = useState<CollectionEntryDraft>({
    month: initial.collections.selectedMonth,
    day: initial.collections.selectedDate.slice(8, 10),
    doctorId: "",
    amount: "",
    mode: "Cash",
    notes: "",
  });
  const [statementMode, setStatementMode] = useState<"daily" | "monthly">("daily");
  const [registerScope, setRegisterScope] = useState<"all" | "month">("all");
  const [dayDetailScope, setDayDetailScope] = useState<"date" | "month">("date");
  const [archiveOrder, setArchiveOrder] = useState<"desc" | "asc">("desc");
  const [archiveYear, setArchiveYear] = useState("all");
  const [archiveActiveOnly, setArchiveActiveOnly] = useState(false);

  const previewPaperRef = useRef<HTMLElement | null>(null);
  const modalPaperRef = useRef<HTMLElement | null>(null);
  const statementPaperRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalInvoice(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -------------------------------- helpers ------------------------------- */
  const selectedDoctor = doctors.find((row) => String(row.id) === doctorId) ?? null;

  const refreshCollections = useCallback(async (month?: string, date?: string) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (date) params.set("date", date);
    const response = await fetch(`/api/collections?${params.toString()}`);
    const payload = (await response.json()) as CollectionsResponse;
    setCollections(payload);
    return payload;
  }, []);

  const refreshReports = useCallback(async (month?: string, date?: string) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (date) params.set("date", date);
    const response = await fetch(`/api/reports?${params.toString()}`);
    const payload = (await response.json()) as ReportsResponse;
    setReports(payload);
    return payload;
  }, []);

  const refreshInvoices = useCallback(async () => {
    const response = await fetch("/api/invoices");
    const payload = (await response.json()) as { invoices: InvoiceRow[] };
    setInvoices(payload.invoices);
    return payload.invoices;
  }, []);

  const notify = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    setToast({ message, tone });
  }, []);

  /* ------------------------------- memo build ----------------------------- */
  const draftMemo = useMemo<InvoiceMemo>(() => {
    const itemsTotal = round2(
      lines.reduce((sum, line) => sum + lineTotals(line, medicines).lineTotal, 0),
    );
    const dues = round2(Number(backDues || 0));
    return {
      invoiceNo: savedInvoice?.invoiceNo ?? null,
      dateLabel: savedInvoice
        ? formatDay(savedInvoice.createdAt.slice(0, 10))
        : formatDay(todayISO()),
      doctorName: selectedDoctor?.name ?? "",
      doctorAddress: selectedDoctor?.address ?? "",
      doctorPhone: selectedDoctor?.phone ?? "",
      lines: lines
        .filter((line) => line.medicineId)
        .map((line) => {
          const { medicine, mrp, unitRate, lineTotal } = lineTotals(line, medicines);
          return {
            key: line.uid,
            title: `${line.quantity} pcs · ${medicine?.name ?? ""}`,
            sub: `MRP ${formatINR(mrp)} · ${line.discount}% less · ${formatINR(unitRate)}/pc`,
            amount: lineTotal,
          };
        }),
      itemsTotal,
      backDues: dues,
      grandTotal: round2(itemsTotal + dues),
    };
  }, [lines, medicines, backDues, savedInvoice, selectedDoctor]);

  const savedMemo = useMemo<InvoiceMemo | null>(() => {
    if (!modalInvoice) return null;
    return {
      invoiceNo: modalInvoice.invoiceNo,
      dateLabel: formatDay(modalInvoice.createdAt.slice(0, 10)),
      doctorName: modalInvoice.doctorName,
      doctorAddress: modalInvoice.doctorAddress,
      doctorPhone: modalInvoice.doctorPhone,
      lines: modalInvoice.items.map((item) => ({
        key: String(item.id),
        title: `${item.quantity} pcs · ${item.medicineName}`,
        sub: `MRP ${formatINR(item.mrp)} · ${item.discountPercent}% less · ${formatINR(
          item.unitRate,
        )}/pc`,
        amount: Number(item.lineTotal),
      })),
      itemsTotal: Number(modalInvoice.itemsTotal),
      backDues: Number(modalInvoice.backDues),
      grandTotal: Number(modalInvoice.grandTotal),
    };
  }, [modalInvoice]);

  const statementMemo = useMemo<StatementMemo>(() => {
    const daily = statementMode === "daily";
    const rows = daily ? collections.dateEntries : collections.monthEntries;
    const total = Number(daily ? collections.selectedDateTotal : collections.monthlyTotal);
    const doctorCount = daily
      ? collections.selectedDateDoctorCount
      : collections.monthlyDoctorCount;
    const entryCount = daily ? collections.selectedDateEntryCount : collections.monthlyEntryCount;
    return {
      docType: daily ? "DAILY COLLECTION" : "MONTHLY COLLECTION",
      numberTop: daily
        ? formatDay(collections.selectedDate)
        : monthLabel(collections.selectedMonth),
      numberBottom: `${entryCount} Entries`,
      dateHeading: daily ? "COLLECTION DATE" : "COLLECTION MONTH",
      dateLabel: daily
        ? formatDay(collections.selectedDate)
        : monthLabel(collections.selectedMonth),
      metaLabel: `${doctorCount} Doctors · ${entryCount} Payments`,
      total,
      lines: rows.map((row) => ({
        key: String(row.id),
        title: `${formatDay(row.collectionDate)} · ${row.doctorName}`,
        sub: `${row.paymentMode}${row.notes ? ` · ${row.notes}` : ""}`,
        amount: Number(row.amount),
      })),
      totalLabel: daily
        ? `Total (${formatDay(collections.selectedDate)}):`
        : `Total (${monthLabel(collections.selectedMonth)}):`,
      emptyText: daily
        ? `No market collections recorded for ${formatDay(collections.selectedDate)}`
        : `No market collections recorded in ${monthLabel(collections.selectedMonth)}`,
    };
  }, [statementMode, collections]);

  const printMemo = tab === "collection" && !modalInvoice ? null : savedMemo ?? draftMemo;

  /* ------------------------------- exports -------------------------------- */
  const runExport = useCallback(
    async (label: string, task: () => Promise<void>) => {
      setBusy(label);
      try {
        await task();
      } catch (error) {
        notify(
          error instanceof Error ? error.message : "Export failed — please try again",
          "error",
        );
      } finally {
        setBusy(null);
      }
    },
    [notify],
  );

  const invoiceFileName = (invoiceNo: string | null | undefined) =>
    `Ankit-Traders-${(invoiceNo || "Draft-Bill").replace(/[^A-Za-z0-9-]/g, "")}-A5`;

  const statementFileName = () =>
    statementMode === "daily"
      ? `Ankit-Traders-Collection-${collections.selectedDate}-A5`
      : `Ankit-Traders-Collection-${collections.selectedMonth}-A5`;

  const handleInvoiceExport = useCallback(
    (kind: "pdf" | "jpg" | "print") => {
      const node = modalInvoice ? modalPaperRef.current : previewPaperRef.current;
      const name = invoiceFileName(modalInvoice?.invoiceNo ?? savedInvoice?.invoiceNo);
      if (kind === "print") {
        void runExport("Opening A5 print dialog…", () =>
          printA5Sheet(`Ankit Traders · ${modalInvoice?.invoiceNo ?? "Cash Memo"}`),
        );
        return;
      }
      if (!node) {
        notify("Invoice preview is not ready yet", "error");
        return;
      }
      void runExport(
        kind === "pdf" ? "Preparing A5 PDF · 300 DPI…" : "Preparing A5 JPG · 300 DPI…",
        () =>
          kind === "pdf"
            ? exportA5Pdf(node, `${name}.pdf`)
            : exportA5Jpg(node, `${name}.jpg`),
      );
    },
    [modalInvoice, savedInvoice, notify, runExport],
  );

  const handleStatementExport = useCallback(
    (kind: "pdf" | "jpg" | "print") => {
      if (kind === "print") {
        void runExport("Opening A5 print dialog…", () =>
          printA5Sheet(
            `Ankit Traders · ${
              statementMode === "daily"
                ? formatDay(collections.selectedDate)
                : monthLabel(collections.selectedMonth)
            } Collection`,
          ),
        );
        return;
      }
      const node = statementPaperRef.current;
      if (!node) {
        notify("Statement preview is not ready yet", "error");
        return;
      }
      const name = statementFileName();
      void runExport(
        kind === "pdf" ? "Preparing A5 PDF · 300 DPI…" : "Preparing A5 JPG · 300 DPI…",
        () =>
          kind === "pdf" ? exportA5Pdf(node, `${name}.pdf`) : exportA5Jpg(node, `${name}.jpg`),
      );
    },
    [collections.selectedDate, collections.selectedMonth, notify, runExport, statementMode],
  );

  const handleDayExport = useCallback(
    async (date: string, kind: "pdf" | "jpg") => {
      setBusy("Loading day sheet…");
      try {
        await refreshCollections(date.slice(0, 7), date);
        setStatementMode("daily");
        await new Promise((resolve) => setTimeout(resolve, 320));
        const node = statementPaperRef.current;
        if (!node) throw new Error("Statement preview is not ready yet");
        const name = `Ankit-Traders-Collection-${date}-A5`;
        setBusy(kind === "pdf" ? "Preparing A5 PDF · 300 DPI…" : "Preparing A5 JPG · 300 DPI…");
        if (kind === "pdf") await exportA5Pdf(node, `${name}.pdf`);
        else await exportA5Jpg(node, `${name}.jpg`);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Export failed", "error");
      } finally {
        setBusy(null);
      }
    },
    [notify, refreshCollections],
  );

  /* ------------------------------ invoice ops ----------------------------- */
  const onDoctorChange = (value: string) => {
    setDoctorId(value);
    const doctor = doctors.find((row) => String(row.id) === value);
    const doctorDiscount = Number(doctor?.discountPercent ?? 0);
    const next = doctorDiscount >= 30 && doctorDiscount <= 60 ? Math.round(doctorDiscount) : 30;
    setDiscount(next);
    setLines((current) => current.map((line) => ({ ...line, discount: next })));
    setSavedInvoice(null);
  };

  const onDiscountChange = (value: number) => {
    setDiscount(value);
    setLines((current) => current.map((line) => ({ ...line, discount: value })));
    setSavedInvoice(null);
  };

  const onLineChange = (uid: string, patch: Partial<InvoiceLineState>) => {
    setLines((current) => current.map((line) => (line.uid === uid ? { ...line, ...patch } : line)));
    setSavedInvoice(null);
  };

  const canSaveInvoice =
    Boolean(selectedDoctor) &&
    lines.some((line) => line.medicineId && line.quantity > 0) &&
    !savingInvoice;

  const saveInvoice = async () => {
    if (!selectedDoctor) {
      notify("Please select a doctor first", "error");
      return;
    }
    setSavingInvoice(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          discountPercent: discount,
          backDues: Number(backDues || 0),
          items: lines
            .filter((line) => line.medicineId)
            .map((line) => ({
              medicineId: Number(line.medicineId),
              quantity: line.quantity,
              discountPercent: line.discount,
            })),
        }),
      });
      const payload = (await response.json()) as { invoice?: InvoiceRow; error?: string };
      if (!response.ok || !payload.invoice) throw new Error(payload.error ?? "Failed to save");
      setSavedInvoice(payload.invoice);
      await Promise.all([
        refreshInvoices(),
        refreshReports(payload.invoice.createdAt.slice(0, 7), payload.invoice.createdAt.slice(0, 10)),
      ]);
      notify(`Invoice ${payload.invoice.invoiceNo} saved · A5 PDF/JPG/print ready`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to save invoice", "error");
    } finally {
      setSavingInvoice(false);
    }
  };

  const newBill = () => {
    setSavedInvoice(null);
    setDoctorId("");
    setBackDues("0");
    setLines([{ uid: makeUid(), medicineId: "", quantity: 1, discount: discount }]);
    setTab("invoice");
    notify("New bill started");
  };

  /* ----------------------------- collection ops --------------------------- */
  const saveEntry = async () => {
    const date = `${entry.month}-${entry.day.padStart(2, "0")}`;
    if (!entry.doctorId || Number(entry.amount || 0) <= 0) {
      notify("Select a doctor and enter an amount", "error");
      return;
    }
    setSavingEntry(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionDate: date,
          doctorId: Number(entry.doctorId),
          amount: Number(entry.amount),
          paymentMode: entry.mode,
          notes: entry.notes,
        }),
      });
      const payload = (await response.json()) as {
        collections?: CollectionsResponse;
        error?: string;
      };
      if (!response.ok || !payload.collections) throw new Error(payload.error ?? "Failed to save");
      setCollections(payload.collections);
      setEntry((current) => ({ ...current, amount: "", notes: "" }));
      notify(`Collection of ${formatINR(entry.amount)} saved for ${formatDay(date)}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to save collection", "error");
    } finally {
      setSavingEntry(false);
    }
  };

  const saveDay = async () => {
    setSavingDay(true);
    try {
      const response = await fetch("/api/collections/day-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: collections.selectedDate, notes: "" }),
      });
      const payload = (await response.json()) as {
        collections?: CollectionsResponse;
        error?: string;
      };
      if (!response.ok || !payload.collections) throw new Error(payload.error ?? "Failed to save");
      setCollections(payload.collections);
      notify(`Full day collection saved for ${formatDay(collections.selectedDate)}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to save day", "error");
    } finally {
      setSavingDay(false);
    }
  };

  const deleteEntry = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this collection entry?")) return;
    try {
      const response = await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete entry");
      await refreshCollections(collections.selectedMonth, collections.selectedDate);
      notify("Collection entry deleted");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to delete entry", "error");
    }
  };

  const changeCollectionFilter = async (month?: string, date?: string) => {
    await refreshCollections(month ?? collections.selectedMonth, date ?? collections.selectedDate);
  };

  const viewDay = async (date: string) => {
    await refreshCollections(date.slice(0, 7), date);
    setStatementMode("daily");
    setDayDetailScope("date");
    setEntry((current) => ({
      ...current,
      month: date.slice(0, 7),
      day: date.slice(8, 10),
    }));
  };

  /* -------------------------------- master ops ---------------------------- */
  const saveDoctor = async (draft: {
    id: number | null;
    name: string;
    phone: string;
    address: string;
  }) => {
    try {
      const response = await fetch(draft.id ? `/api/doctors/${draft.id}` : "/api/doctors", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          phone: draft.phone,
          address: draft.address,
        }),
      });
      if (!response.ok) throw new Error("Failed to save doctor");
      const payload = (await response.json()) as { doctors?: DoctorRow[] };
      const listResponse = await fetch("/api/doctors");
      const list = (await listResponse.json()) as { doctors: DoctorRow[] };
      setDoctors(list.doctors);
      void payload;
      notify(draft.id ? "Doctor updated" : "Doctor saved to Master");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to save doctor", "error");
    }
  };

  const deleteDoctor = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this doctor from Master?")) return;
    try {
      const response = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete doctor");
      const list = (await (await fetch("/api/doctors")).json()) as { doctors: DoctorRow[] };
      setDoctors(list.doctors);
      notify("Doctor deleted");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to delete doctor", "error");
    }
  };

  const saveMedicine = async (draft: { id: number | null; name: string; mrp: string }) => {
    try {
      const response = await fetch(draft.id ? `/api/medicines/${draft.id}` : "/api/medicines", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, mrp: Number(draft.mrp) }),
      });
      if (!response.ok) throw new Error("Failed to save medicine");
      const list = (await (await fetch("/api/medicines")).json()) as { medicines: MedicineRow[] };
      setMedicines(list.medicines);
      notify(draft.id ? "Medicine updated" : "Medicine saved to Master");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to save medicine", "error");
    }
  };

  const deleteMedicine = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this medicine?")) return;
    try {
      const response = await fetch(`/api/medicines/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete medicine");
      const list = (await (await fetch("/api/medicines")).json()) as { medicines: MedicineRow[] };
      setMedicines(list.medicines);
      notify("Medicine deleted");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to delete medicine", "error");
    }
  };

  const shareLink = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const text = `Open Ankit Traders Billing & Market Collection App ${url}`.trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ankit Traders Billing", text, url });
        return;
      }
      await navigator.clipboard.writeText(text);
      notify("App link copied to clipboard");
    } catch {
      notify("Could not copy link automatically", "error");
    }
  };

  /* --------------------------------- render ------------------------------- */
  const meta = TAB_META[tab];
  const monthBilling = Number(
    reports.monthlyTotals.find((row) => row.month === reports.selectedMonth)?.total ?? 0,
  );
  const monthInvoiceCount =
    reports.monthlyTotals.find((row) => row.month === reports.selectedMonth)?.invoiceCount ?? 0;

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Ankit Traders"
              className="brand-logo"
              src="/images/ankit-traders-logo.jpg"
            />
            <div>
              <p className="brand-name">Ankit Traders</p>
              <p className="brand-caption">Herbal Products Billing</p>
            </div>
          </div>

          <p className="sidebar-label">Workspace</p>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {(Object.keys(TAB_META) as TabKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`nav-button ${tab === key ? "active" : ""}`}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                <span className="nav-icon">{NAV_ICONS[key]}</span>
                <span>{TAB_META[key].label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <span className="sidebar-note-icon">
                <ShieldIcon size={16} />
              </span>
              <strong>Your Data, Always Secure</strong>
              <p>
                All doctors, medicines, invoices, and market collections are saved in PostgreSQL
                with instant A5 PDF &amp; JPG export.
              </p>
            </div>
            <a
              className="secondary-button standalone-download"
              href="/api/download"
              download="ankit-traders-billing.html"
            >
              <DownloadIcon size={15} /> Download single-file app
            </a>
            <p className="sidebar-note-sub">
              Offline copy (HTML/CSS/JS in one file) for Vercel, Netlify or GitHub Pages.
            </p>
            <div className="sidebar-footer">
              <span>●</span> Ready to Bill · Ankit Traders
            </div>
          </div>
        </aside>

        <div className="main-panel">
          <header className="topbar">
            <div className="topbar-copy">
              <p className="topbar-eyebrow">{meta.eyebrow}</p>
              <h1>{meta.title}</h1>
              <p className="topbar-subtitle">{meta.subtitle}</p>
            </div>
            <div className="topbar-actions">
              {tab === "invoice" ? (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setTab("collection")}
                  >
                    <WalletIcon size={15} /> Market Collection
                  </button>
                  <button className="secondary-button" type="button" onClick={newBill}>
                    <PlusIcon size={15} /> New Bill
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setTab(tab === "collection" ? "reports" : "collection")}
                  >
                    {tab === "collection" ? (
                      <>
                        <CalendarIcon size={15} /> Billing Reports
                      </>
                    ) : (
                      <>
                        <WalletIcon size={15} /> Market Collection
                      </>
                    )}
                  </button>
                  <button className="primary-button" type="button" onClick={() => setTab("invoice")}>
                    <ReceiptIcon size={15} /> Create Invoice
                  </button>
                </>
              )}
              <div className="topbar-avatar" aria-label="Medical Representative">
                MR
              </div>
            </div>
          </header>

          <main className="content-wrap">
            {tab === "invoice" ? (
              <CreateInvoiceView
                doctors={doctors}
                medicines={medicines}
                monthBilling={monthBilling}
                monthInvoiceCount={monthInvoiceCount}
                marketTotal={Number(collections.monthlyTotal)}
                marketMonthLabel={monthLabel(collections.selectedMonth)}
                doctorId={doctorId}
                discount={discount}
                backDues={backDues}
                lines={lines}
                memo={draftMemo}
                canSave={canSaveInvoice}
                saving={savingInvoice}
                savedInvoiceNo={savedInvoice?.invoiceNo ?? null}
                busyLabel={busy}
                previewRef={previewPaperRef}
                onDoctorChange={onDoctorChange}
                onDiscountChange={onDiscountChange}
                onBackDuesChange={(value) => {
                  setBackDues(value);
                  setSavedInvoice(null);
                }}
                onLineChange={onLineChange}
                onAddLine={() =>
                  setLines((current) => [
                    ...current,
                    { uid: makeUid(), medicineId: "", quantity: 1, discount },
                  ])
                }
                onRemoveLine={(uid) =>
                  setLines((current) =>
                    current.length === 1
                      ? [{ uid: makeUid(), medicineId: "", quantity: 1, discount }]
                      : current.filter((line) => line.uid !== uid),
                  )
                }
                onSave={() => void saveInvoice()}
                onDownloadPdf={() => handleInvoiceExport("pdf")}
                onDownloadJpg={() => handleInvoiceExport("jpg")}
                onPrint={() => handleInvoiceExport("print")}
                onGoCollection={() => setTab("collection")}
                onGoMasters={() => setTab("masters")}
                onNewBill={newBill}
                onShare={() => void shareLink()}
              />
            ) : null}

            {tab === "collection" ? (
              <MarketCollectionView
                collections={collections}
                doctors={doctors}
                months={months}
                entry={entry}
                savingEntry={savingEntry}
                savingDay={savingDay}
                statementMode={statementMode}
                statementMemo={statementMemo}
                statementRef={statementPaperRef}
                registerScope={registerScope}
                dayDetailScope={dayDetailScope}
                archiveOrder={archiveOrder}
                archiveYear={archiveYear}
                archiveActiveOnly={archiveActiveOnly}
                busyLabel={busy}
                onEntryChange={(patch) => setEntry((current) => ({ ...current, ...patch }))}
                onFilterMonthChange={(month) => void changeCollectionFilter(month)}
                onFilterDateChange={(date) => void changeCollectionFilter(date.slice(0, 7), date)}
                onSaveEntry={() => void saveEntry()}
                onSaveDay={() => void saveDay()}
                onDeleteEntry={(id) => void deleteEntry(id)}
                onViewDay={(date) => void viewDay(date)}
                onStatementMode={setStatementMode}
                onRegisterScope={setRegisterScope}
                onDayDetailScope={setDayDetailScope}
                onArchiveOrder={() =>
                  setArchiveOrder((current) => (current === "desc" ? "asc" : "desc"))
                }
                onArchiveYear={setArchiveYear}
                onArchiveActiveOnly={() => setArchiveActiveOnly((current) => !current)}
                onExport={(kind) => {
                  if (kind === "daily-pdf") {
                    setStatementMode("daily");
                    setTimeout(() => handleStatementExport("pdf"), 220);
                  } else if (kind === "daily-jpg") {
                    setStatementMode("daily");
                    setTimeout(() => handleStatementExport("jpg"), 220);
                  } else if (kind === "monthly-pdf") {
                    setStatementMode("monthly");
                    setTimeout(() => handleStatementExport("pdf"), 220);
                  } else {
                    setStatementMode("monthly");
                    setTimeout(() => handleStatementExport("jpg"), 220);
                  }
                }}
                onExportDay={(date, kind) => void handleDayExport(date, kind)}
                onPrint={() => handleStatementExport("print")}
                onGoInvoice={() => setTab("invoice")}
                onAddDoctor={() => setTab("masters")}
              />
            ) : null}

            {tab === "catalogue" ? <CatalogueView onNotify={notify} /> : null}

            {tab === "masters" ? (
              <MastersView
                doctors={doctors}
                medicines={medicines}
                busyLabel={busy}
                onSaveDoctor={saveDoctor}
                onDeleteDoctor={(id) => void deleteDoctor(id)}
                onSaveMedicine={saveMedicine}
                onDeleteMedicine={(id) => void deleteMedicine(id)}
              />
            ) : null}

            {tab === "history" ? (
              <HistoryView invoices={invoices} onView={(invoice) => setModalInvoice(invoice)} />
            ) : null}

            {tab === "reports" ? (
              <ReportsView
                reports={reports}
                months={months}
                busyLabel={busy}
                onMonthChange={(month) => void refreshReports(month, reports.selectedDate)}
                onDateChange={(date) => void refreshReports(date.slice(0, 7), date)}
                onViewDay={(date) => void refreshReports(date.slice(0, 7), date)}
                onViewInvoice={(invoice) => setModalInvoice(invoice)}
              />
            ) : null}
          </main>
        </div>
      </div>

      {modalInvoice && savedMemo ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setModalInvoice(null)}
        >
          <section
            className="invoice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="invoice-modal-title">Invoice {modalInvoice.invoiceNo}</h2>
                <p>
                  {modalInvoice.doctorName} · {formatDay(modalInvoice.createdAt.slice(0, 10))} · A5
                  export
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setModalInvoice(null)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="a5-preview-frame">
                <InvoicePaper memo={savedMemo} paperRef={modalPaperRef} />
              </div>
              <div className="modal-actions">
                <button
                  className="download-button"
                  type="button"
                  onClick={() => handleInvoiceExport("print")}
                >
                  <PrinterIcon size={15} /> Print Cash Memo (A5)
                </button>
                <button
                  className="download-button"
                  type="button"
                  onClick={() => handleInvoiceExport("jpg")}
                >
                  <ImageIcon size={15} /> Download JPG (A5)
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => handleInvoiceExport("pdf")}
                >
                  <DownloadIcon size={15} /> Download PDF (A5)
                </button>
              </div>
              <p className="export-help" style={{ textAlign: "center" }}>
                A5 sheet · 148 × 210 mm · 300 DPI high-resolution export
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {/* A5 print sheet — lives OUTSIDE .app-shell so printing is never blank */}
      <div className="print-only-sheet" aria-hidden="true">
        {tab === "collection" && !modalInvoice ? (
          <StatementPaper memo={statementMemo} a5 ariaLabel="A5 print sheet" />
        ) : printMemo ? (
          <InvoicePaper memo={printMemo} a5 ariaLabel="A5 print sheet" />
        ) : null}
      </div>

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </>
  );
}
