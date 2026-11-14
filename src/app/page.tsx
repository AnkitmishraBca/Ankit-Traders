import { Suspense } from "react";
import BillingWorkspace from "@/components/BillingWorkspace";
import {
  getCollectionsPayload,
  getMinimumMonth,
  getReportsPayload,
  listDoctors,
  listInvoices,
  listMedicines,
} from "@/lib/server/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [minimumMonth, doctors, medicines, invoices] = await Promise.all([
    getMinimumMonth(),
    listDoctors(),
    listMedicines(),
    listInvoices(),
  ]);
  const [collections, reports] = await Promise.all([
    getCollectionsPayload(),
    getReportsPayload(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="loading-screen">
          <div className="loading-inline">
            <span className="spinner" /> Loading Ankit Traders…
          </div>
        </div>
      }
    >
      <BillingWorkspace initial={{ doctors, medicines, invoices, collections, reports, minimumMonth }} />
    </Suspense>
  );
}
