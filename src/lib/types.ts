export type DoctorRow = {
  id: number;
  name: string;
  address: string;
  phone: string;
  discountPercent: string;
  createdAt: string;
};

export type MedicineRow = {
  id: number;
  name: string;
  mrp: string;
  createdAt: string;
};

export type InvoiceItemRow = {
  id: number;
  invoiceId: number;
  medicineId: number | null;
  medicineName: string;
  mrp: string;
  discountPercent: string;
  unitRate: string;
  quantity: number;
  lineTotal: string;
};

export type InvoiceRow = {
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
  items: InvoiceItemRow[];
};

export type CollectionRow = {
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
};

export type DoctorBreakdown = {
  id: number;
  doctorName: string;
  amount: string;
  paymentMode: string;
};

export type DaySummary = {
  date: string;
  entryCount: number;
  doctorCount: number;
  total: string;
  isDaySaved: boolean;
  daySavedNotes: string;
  daySavedAt: string | null;
  doctorsBreakdown: DoctorBreakdown[];
};

export type MonthTotal = {
  month: string;
  entryCount: number;
  doctorCount: number;
  total: string;
};

export type CollectionsResponse = {
  selectedMonth: string;
  selectedDate: string;
  minimumMonth: string;
  today: string;
  monthlyTotals: MonthTotal[];
  allTime48MonthTotal: string;
  monthlyTotal: string;
  monthlyEntryCount: number;
  monthlyDoctorCount: number;
  dailyTotals: DaySummary[];
  allDailySummaries: DaySummary[];
  monthEntries: CollectionRow[];
  selectedDateTotal: string;
  selectedDateEntryCount: number;
  selectedDateDoctorCount: number;
  selectedDateIsSaved: boolean;
  selectedDateNotes: string;
  dateEntries: CollectionRow[];
};

export type ReportMonthTotal = { month: string; invoiceCount: number; total: string };
export type ReportDayTotal = { date: string; invoiceCount: number; total: string };

export type ReportsResponse = {
  selectedMonth: string;
  selectedDate: string;
  minimumMonth: string;
  today: string;
  monthlyTotals: ReportMonthTotal[];
  monthlyTotal: string;
  monthlyInvoiceCount: number;
  dailyTotals: ReportDayTotal[];
  selectedDateTotal: string;
  selectedDateInvoiceCount: number;
  dateInvoices: InvoiceRow[];
};

export type TabKey = "invoice" | "collection" | "masters" | "history" | "reports";
