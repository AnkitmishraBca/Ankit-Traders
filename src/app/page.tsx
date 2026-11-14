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

async function DataLoader() {
  const [minimumMonth, doctors, medicines, invoices, collections, reports] =
    await Promise.all([
      getMinimumMonth(),
      listDoctors(),
      listMedicines(),
      listInvoices(),
      getCollectionsPayload(),
      getReportsPayload(),
    ]);

  return (
    <BillingWorkspace
      initial={{
        doctors,
        medicines,
        invoices,
        collections,
        reports,
        minimumMonth,
      }}
    />
  );
}

export default function HomePage() {
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
      <DataLoader />
    </Suspense>
  );
}
