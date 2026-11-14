import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  collectionEntries,
  daySaves,
  doctors,
  invoiceItems,
  invoices,
  medicines,
} from "@/db/schema";
import type {
  CollectionRow,
  CollectionsResponse,
  DaySummary,
  DoctorRow,
  InvoiceRow,
  MedicineRow,
  MonthTotal,
  ReportDayTotal,
  ReportMonthTotal,
  ReportsResponse,
} from "@/lib/types";
import { addMonths, build48Months, monthKey, round2, todayISO } from "@/lib/format";

export function isoDate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapDoctor(row: typeof doctors.$inferSelect): DoctorRow {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    phone: row.phone ?? "",
    discountPercent: row.discountPercent ?? "0",
    createdAt: row.createdAt.toISOString(),
  };
}

function mapMedicine(row: typeof medicines.$inferSelect): MedicineRow {
  return {
    id: row.id,
    name: row.name,
    mrp: row.mrp,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCollection(row: typeof collectionEntries.$inferSelect): CollectionRow {
  return {
    id: row.id,
    collectionDate: row.collectionDate,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    doctorPhone: row.doctorPhone ?? "",
    doctorAddress: row.doctorAddress ?? "",
    amount: row.amount,
    paymentMode: row.paymentMode ?? "Cash",
    notes: row.notes ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listDoctors(): Promise<DoctorRow[]> {
  const rows = await db
    .select()
    .from(doctors)
    .orderBy(asc(sql`lower(${doctors.name})`));
  return rows.map(mapDoctor);
}

export async function listMedicines(): Promise<MedicineRow[]> {
  const rows = await db
    .select()
    .from(medicines)
    .orderBy(asc(sql`lower(${medicines.name})`));
  return rows.map(mapMedicine);
}

export async function listInvoices(): Promise<InvoiceRow[]> {
  const rows = await db.select().from(invoices).orderBy(sql`${invoices.createdAt} desc`);
  if (rows.length === 0) return [];
  const itemRows = await db
    .select()
    .from(invoiceItems)
    .where(inArray(invoiceItems.invoiceId, rows.map((r) => r.id)))
    .orderBy(asc(invoiceItems.id));

  return rows.map((row) => ({
    id: row.id,
    invoiceNo: row.invoiceNo,
    doctorId: row.doctorId,
    doctorName: row.doctorName,
    doctorAddress: row.doctorAddress ?? "",
    doctorPhone: row.doctorPhone ?? "",
    discountPercent: row.discountPercent ?? "0",
    itemsTotal: row.itemsTotal,
    backDues: row.backDues ?? "0",
    grandTotal: row.grandTotal,
    createdAt: row.createdAt.toISOString(),
    items: itemRows
      .filter((item) => item.invoiceId === row.id)
      .map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        mrp: item.mrp,
        discountPercent: item.discountPercent ?? "0",
        unitRate: item.unitRate,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
  }));
}

/** Earliest month that has any record — the 48-month archive starts here. */
export async function getMinimumMonth(): Promise<string> {
  const current = monthKey();
  const results = await Promise.all([
    db.select({ value: sql<string | null>`min(${doctors.createdAt})` }).from(doctors),
    db.select({ value: sql<string | null>`min(${medicines.createdAt})` }).from(medicines),
    db.select({ value: sql<string | null>`min(${invoices.createdAt})` }).from(invoices),
    db
      .select({ value: sql<string | null>`min(${collectionEntries.createdAt})` })
      .from(collectionEntries),
    db
      .select({ value: sql<string | null>`min(${collectionEntries.collectionDate})` })
      .from(collectionEntries),
  ]);

  const candidates: string[] = [current];
  for (const result of results) {
    const raw = result[0]?.value;
    if (!raw) continue;
    const parsed = new Date(raw as string);
    if (!Number.isNaN(parsed.getTime())) candidates.push(monthKey(parsed));
    else if (typeof raw === "string" && /^\d{4}-\d{2}/.test(raw)) candidates.push(raw.slice(0, 7));
  }
  return candidates.sort()[0] ?? current;
}

export function buildMonthWindow(minimumMonth: string): string[] {
  const current = monthKey();
  const months = build48Months(minimumMonth);
  const last = months[months.length - 1];
  if (current > last) {
    const extra: string[] = [];
    let cursor = addMonths(last, 1);
    while (cursor <= current && extra.length < 240) {
      extra.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return [...months, ...extra];
  }
  return months;
}

async function allCollections(windowMonths: string[]): Promise<CollectionRow[]> {
  const rows = await db.select().from(collectionEntries).orderBy(asc(collectionEntries.id));
  const first = windowMonths[0];
  const last = windowMonths[windowMonths.length - 1];
  return rows
    .map(mapCollection)
    .filter((row) => row.collectionDate.slice(0, 7) >= first && row.collectionDate.slice(0, 7) <= last);
}

async function allDaySaves(): Promise<Map<string, { notes: string; savedAt: string | null }>> {
  const rows = await db.select().from(daySaves);
  return new Map(
    rows.map((row) => [
      row.dayDate,
      { notes: row.notes ?? "", savedAt: row.savedAt ? row.savedAt.toISOString() : null },
    ]),
  );
}

function buildDaySummary(
  date: string,
  entries: CollectionRow[],
  saves: Map<string, { notes: string; savedAt: string | null }>,
): DaySummary {
  const save = saves.get(date);
  const total = round2(entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
  const grouped = new Map<number, { doctorName: string; amount: number; paymentMode: string }>();
  entries.forEach((entry, index) => {
    const key = entry.doctorId ?? index + 1_000_000;
    const existing = grouped.get(key);
    if (existing) {
      existing.amount = round2(existing.amount + Number(entry.amount || 0));
    } else {
      grouped.set(key, {
        doctorName: entry.doctorName,
        amount: Number(entry.amount || 0),
        paymentMode: entry.paymentMode,
      });
    }
  });

  return {
    date,
    entryCount: entries.length,
    doctorCount: new Set(entries.map((entry) => entry.doctorId ?? entry.doctorName)).size,
    total: total.toFixed(2),
    isDaySaved: Boolean(save),
    daySavedNotes: save?.notes ?? "",
    daySavedAt: save?.savedAt ?? null,
    doctorsBreakdown: Array.from(grouped.entries()).map(([id, value]) => ({
      id,
      doctorName: value.doctorName,
      amount: value.amount.toFixed(2),
      paymentMode: value.paymentMode,
    })),
  };
}

export async function getCollectionsPayload(
  monthParam?: string,
  dateParam?: string,
): Promise<CollectionsResponse> {
  const today = todayISO();
  const minimumMonth = await getMinimumMonth();
  const windowMonths = buildMonthWindow(minimumMonth);
  const selectedMonth =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) && windowMonths.includes(monthParam)
      ? monthParam
      : today.slice(0, 7);
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const [entries, saves] = await Promise.all([allCollections(windowMonths), allDaySaves()]);

  const monthlyTotals: MonthTotal[] = windowMonths.map((month) => {
    const monthEntries = entries.filter((entry) => entry.collectionDate.startsWith(month));
    return {
      month,
      entryCount: monthEntries.length,
      doctorCount: new Set(monthEntries.map((entry) => entry.doctorId ?? entry.doctorName)).size,
      total: round2(
        monthEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      ).toFixed(2),
    };
  });

  const monthEntries = entries.filter((entry) => entry.collectionDate.startsWith(selectedMonth));
  const dateEntries = entries.filter((entry) => entry.collectionDate === selectedDate);

  const activeDates = Array.from(new Set(entries.map((entry) => entry.collectionDate))).sort();
  const dailyTotals = activeDates
    .filter((date) => date.startsWith(selectedMonth))
    .map((date) =>
      buildDaySummary(
        date,
        entries.filter((entry) => entry.collectionDate === date),
        saves,
      ),
    );
  const allDailySummaries = activeDates.map((date) =>
    buildDaySummary(
      date,
      entries.filter((entry) => entry.collectionDate === date),
      saves,
    ),
  );

  const daySummary = buildDaySummary(selectedDate, dateEntries, saves);

  return {
    selectedMonth,
    selectedDate,
    minimumMonth,
    today,
    monthlyTotals,
    allTime48MonthTotal: round2(
      entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    ).toFixed(2),
    monthlyTotal: round2(
      monthEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    ).toFixed(2),
    monthlyEntryCount: monthEntries.length,
    monthlyDoctorCount: new Set(monthEntries.map((entry) => entry.doctorId ?? entry.doctorName))
      .size,
    dailyTotals,
    allDailySummaries,
    monthEntries,
    selectedDateTotal: daySummary.total,
    selectedDateEntryCount: daySummary.entryCount,
    selectedDateDoctorCount: daySummary.doctorCount,
    selectedDateIsSaved: daySummary.isDaySaved,
    selectedDateNotes: daySummary.daySavedNotes,
    dateEntries,
  };
}

export async function getReportsPayload(
  monthParam?: string,
  dateParam?: string,
): Promise<ReportsResponse> {
  const today = todayISO();
  const minimumMonth = await getMinimumMonth();
  const windowMonths = buildMonthWindow(minimumMonth);
  const selectedMonth =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) && windowMonths.includes(monthParam)
      ? monthParam
      : today.slice(0, 7);
  const selectedDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const all = await listInvoices();
  const first = windowMonths[0];
  const last = windowMonths[windowMonths.length - 1];
  const inWindow = all.filter((invoice) => {
    const month = isoDate(invoice.createdAt).slice(0, 7);
    return month >= first && month <= last;
  });

  const monthlyTotals: ReportMonthTotal[] = windowMonths.map((month) => {
    const rows = inWindow.filter((invoice) => isoDate(invoice.createdAt).startsWith(month));
    return {
      month,
      invoiceCount: rows.length,
      total: round2(rows.reduce((sum, row) => sum + Number(row.grandTotal || 0), 0)).toFixed(2),
    };
  });

  const dates = Array.from(new Set(inWindow.map((invoice) => isoDate(invoice.createdAt)))).sort();
  const dailyTotals: ReportDayTotal[] = dates
    .filter((date) => date.startsWith(selectedMonth))
    .map((date) => {
      const rows = inWindow.filter((invoice) => isoDate(invoice.createdAt) === date);
      return {
        date,
        invoiceCount: rows.length,
        total: round2(rows.reduce((sum, row) => sum + Number(row.grandTotal || 0), 0)).toFixed(2),
      };
    });

  const dateInvoices = inWindow.filter((invoice) => isoDate(invoice.createdAt) === selectedDate);

  return {
    selectedMonth,
    selectedDate,
    minimumMonth,
    today,
    monthlyTotals,
    monthlyTotal: round2(
      inWindow
        .filter((invoice) => isoDate(invoice.createdAt).startsWith(selectedMonth))
        .reduce((sum, row) => sum + Number(row.grandTotal || 0), 0),
    ).toFixed(2),
    monthlyInvoiceCount: inWindow.filter((invoice) =>
      isoDate(invoice.createdAt).startsWith(selectedMonth),
    ).length,
    dailyTotals,
    selectedDateTotal: round2(
      dateInvoices.reduce((sum, row) => sum + Number(row.grandTotal || 0), 0),
    ).toFixed(2),
    selectedDateInvoiceCount: dateInvoices.length,
    dateInvoices,
  };
}

export function generateInvoiceNo(date = new Date()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 5; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `AT-${isoDate(date).replace(/-/g, "")}-${suffix}`;
}

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Credit"] as const;
