import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  collectionEntries,
  doctors,
  invoiceItems,
  invoices,
  medicines,
} from "@/db/schema";
import seedData from "@/db/seed-data.json";

type SeedShape = {
  doctors: {
    id: number;
    name: string;
    address: string;
    phone: string;
    discountPercent: string;
    createdAt: string;
  }[];
  medicines: { id: number; name: string; mrp: string; createdAt: string }[];
  invoices: {
    id: number;
    invoiceNo: string;
    doctorId: number | null;
    doctorName: string;
    doctorAddress: string;
    doctorPhone: string;
    discountPercent: string;
    itemsTotal: string;
    backDues: string;
    grandTotal: string;
    createdAt: string;
    items: {
      id: number;
      medicineId: number | null;
      medicineName: string;
      mrp: string;
      discountPercent: string;
      unitRate: string;
      quantity: number;
      lineTotal: string;
    }[];
  }[];
  collections: {
    id: number;
    collectionDate: string;
    doctorId: number | null;
    doctorName: string;
    doctorPhone: string;
    doctorAddress: string;
    amount: string;
    paymentMode: string;
    notes: string;
    createdAt: string;
  }[];
};

const data = seedData as SeedShape;

let attempted = false;

/**
 * Restores the Ankit Traders records (doctors, medicines, invoices, market
 * collections) that were already entered in the app. Runs only when the
 * database is empty, so real data is never overwritten.
 */
export async function ensureSeedData(): Promise<boolean> {
  if (attempted) return false;
  attempted = true;

  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(doctors);
  if (Number(rows[0]?.count ?? 0) > 0) return false;

  await db.insert(doctors).values(
    data.doctors.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      discountPercent: row.discountPercent,
      createdAt: new Date(row.createdAt),
    })),
  );

  await db.insert(medicines).values(
    data.medicines.map((row) => ({
      id: row.id,
      name: row.name,
      mrp: row.mrp,
      createdAt: new Date(row.createdAt),
    })),
  );

  for (const invoice of data.invoices) {
    await db.insert(invoices).values({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      doctorId: invoice.doctorId,
      doctorName: invoice.doctorName,
      doctorAddress: invoice.doctorAddress,
      doctorPhone: invoice.doctorPhone,
      discountPercent: invoice.discountPercent,
      itemsTotal: invoice.itemsTotal,
      backDues: invoice.backDues,
      grandTotal: invoice.grandTotal,
      createdAt: new Date(invoice.createdAt),
    });
    if (invoice.items.length) {
      await db.insert(invoiceItems).values(
        invoice.items.map((item) => ({
          id: item.id,
          invoiceId: invoice.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          mrp: item.mrp,
          discountPercent: item.discountPercent,
          unitRate: item.unitRate,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      );
    }
  }

  if (data.collections.length) {
    await db.insert(collectionEntries).values(
      data.collections.map((row) => ({
        id: row.id,
        collectionDate: row.collectionDate,
        doctorId: row.doctorId,
        doctorName: row.doctorName,
        doctorPhone: row.doctorPhone,
        doctorAddress: row.doctorAddress,
        amount: row.amount,
        paymentMode: row.paymentMode,
        notes: row.notes,
        createdAt: new Date(row.createdAt),
      })),
    );
  }

  const tables = ["doctors", "medicines", "invoices", "invoice_items", "collection_entries"];
  for (const table of tables) {
    await db.execute(
      sql.raw(
        `select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 1))`,
      ),
    );
  }

  return true;
}
