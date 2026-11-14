import {
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  address: text("address").notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  mrp: numeric("mrp", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: varchar("invoice_no", { length: 40 }).notNull().unique(),
  doctorId: integer("doctor_id"),
  doctorName: varchar("doctor_name", { length: 160 }).notNull(),
  doctorAddress: text("doctor_address").notNull().default(""),
  doctorPhone: varchar("doctor_phone", { length: 40 }).notNull().default(""),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  itemsTotal: numeric("items_total", { precision: 12, scale: 2 }).notNull().default("0"),
  backDues: numeric("back_dues", { precision: 12, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  medicineId: integer("medicine_id"),
  medicineName: varchar("medicine_name", { length: 180 }).notNull(),
  mrp: numeric("mrp", { precision: 12, scale: 2 }).notNull().default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  unitRate: numeric("unit_rate", { precision: 12, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").notNull().default(1),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const collectionEntries = pgTable("collection_entries", {
  id: serial("id").primaryKey(),
  collectionDate: date("collection_date", { mode: "string" }).notNull(),
  doctorId: integer("doctor_id"),
  doctorName: varchar("doctor_name", { length: 160 }).notNull(),
  doctorPhone: varchar("doctor_phone", { length: 40 }).notNull().default(""),
  doctorAddress: text("doctor_address").notNull().default(""),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMode: varchar("payment_mode", { length: 30 }).notNull().default("Cash"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const daySaves = pgTable("day_saves", {
  id: serial("id").primaryKey(),
  dayDate: date("day_date", { mode: "string" }).notNull().unique(),
  notes: text("notes").notNull().default(""),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Doctor = typeof doctors.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type CollectionEntry = typeof collectionEntries.$inferSelect;
export type DaySave = typeof daySaves.$inferSelect;
