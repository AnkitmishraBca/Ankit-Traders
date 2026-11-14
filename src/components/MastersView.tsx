import { useState } from "react";
import { PencilIcon, PillIcon, PlusIcon, SaveIcon, TrashIcon, UsersIcon } from "@/components/icons";
import { BusyOverlay, CountPill, FieldLabel, Panel, PanelHeading } from "@/components/ui";
import { formatINR } from "@/lib/format";
import type { DoctorRow, MedicineRow } from "@/lib/types";

type DoctorDraft = { id: number | null; name: string; phone: string; address: string };
type MedicineDraft = { id: number | null; name: string; mrp: string };

const emptyDoctor: DoctorDraft = { id: null, name: "", phone: "", address: "" };
const emptyMedicine: MedicineDraft = { id: null, name: "", mrp: "" };

type Props = {
  doctors: DoctorRow[];
  medicines: MedicineRow[];
  busyLabel: string | null;
  onSaveDoctor: (draft: DoctorDraft) => Promise<void> | void;
  onDeleteDoctor: (id: number) => void;
  onSaveMedicine: (draft: MedicineDraft) => Promise<void> | void;
  onDeleteMedicine: (id: number) => void;
};

export default function MastersView(props: Props) {
  const [doctor, setDoctor] = useState<DoctorDraft>(emptyDoctor);
  const [medicine, setMedicine] = useState<MedicineDraft>(emptyMedicine);

  return (
    <>
      <div className="master-grid">
        <Panel className="master-card">
          <PanelHeading
            title="Doctor Master"
            subtitle="Save each doctor's name, phone number, and clinic address."
            chip={<UsersIcon size={15} />}
          />
          <form
            className="master-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!doctor.name.trim()) return;
              void props.onSaveDoctor(doctor);
              setDoctor(emptyDoctor);
            }}
          >
            <div className="master-form-grid">
              <div>
                <FieldLabel htmlFor="new-doctor-name">Doctor&apos;s Full Name</FieldLabel>
                <input
                  id="new-doctor-name"
                  className="input-control"
                  required
                  maxLength={140}
                  placeholder="e.g. Dr. Anita Mehra"
                  value={doctor.name}
                  onChange={(event) => setDoctor({ ...doctor, name: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="new-doctor-phone">Phone Number</FieldLabel>
                <input
                  id="new-doctor-phone"
                  className="input-control"
                  maxLength={30}
                  placeholder="+91 98765 43210"
                  value={doctor.phone}
                  onChange={(event) => setDoctor({ ...doctor, phone: event.target.value })}
                />
              </div>
              <div className="full-span">
                <FieldLabel htmlFor="new-doctor-address">Clinic / Delivery Address</FieldLabel>
                <textarea
                  id="new-doctor-address"
                  className="input-control"
                  maxLength={1000}
                  placeholder="Complete clinic or delivery address"
                  value={doctor.address}
                  onChange={(event) => setDoctor({ ...doctor, address: event.target.value })}
                />
              </div>
            </div>
            <button className="primary-button" type="submit">
              {doctor.id ? <PencilIcon size={15} /> : <PlusIcon size={15} />}
              {doctor.id ? "Update Doctor" : "Save Doctor"}
            </button>
            {doctor.id ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setDoctor(emptyDoctor)}
              >
                Cancel Edit
              </button>
            ) : null}
          </form>

          <div className="master-list-title">
            <span>Saved Doctors</span>
            <CountPill>{props.doctors.length}</CountPill>
          </div>
          <div className="master-list">
            {props.doctors.map((row) => (
              <div className="master-list-row" key={row.id}>
                <div className="master-list-main">
                  <strong>{row.name}</strong>
                  <span>
                    {row.phone || "No phone"} · {row.address || "No address"}
                  </span>
                </div>
                <div className="master-row-right">
                  <button
                    type="button"
                    className="icon-mini-btn"
                    title="Edit doctor"
                    aria-label={`Edit ${row.name}`}
                    onClick={() =>
                      setDoctor({
                        id: row.id,
                        name: row.name,
                        phone: row.phone,
                        address: row.address,
                      })
                    }
                  >
                    <PencilIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-mini-btn danger"
                    title="Delete doctor"
                    aria-label={`Delete ${row.name}`}
                    onClick={() => props.onDeleteDoctor(row.id)}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="master-card">
          <PanelHeading
            title="Medicine Master"
            subtitle="Save each product's MRP once to auto-calculate net rates in invoices."
            chip={<PillIcon size={15} />}
          />
          <form
            className="master-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!medicine.name.trim() || Number(medicine.mrp) <= 0) return;
              void props.onSaveMedicine(medicine);
              setMedicine(emptyMedicine);
            }}
          >
            <div className="master-form-grid">
              <div className="full-span">
                <FieldLabel htmlFor="new-medicine-name">Medicine Name</FieldLabel>
                <input
                  id="new-medicine-name"
                  className="input-control"
                  required
                  maxLength={160}
                  placeholder="e.g. Ayur Care Tonic"
                  value={medicine.name}
                  onChange={(event) => setMedicine({ ...medicine, name: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="new-medicine-mrp">MRP (₹)</FieldLabel>
                <input
                  id="new-medicine-mrp"
                  className="input-control"
                  type="number"
                  required
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  placeholder="180.00"
                  value={medicine.mrp}
                  onChange={(event) => setMedicine({ ...medicine, mrp: event.target.value })}
                />
              </div>
            </div>
            <button className="primary-button" type="submit">
              {medicine.id ? <PencilIcon size={15} /> : <SaveIcon size={15} />}
              {medicine.id ? "Update Medicine" : "Save Medicine"}
            </button>
            {medicine.id ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setMedicine(emptyMedicine)}
              >
                Cancel Edit
              </button>
            ) : null}
          </form>

          <div className="master-list-title">
            <span>Saved Medicines</span>
            <CountPill>{props.medicines.length}</CountPill>
          </div>
          <div className="master-list">
            {props.medicines.map((row) => (
              <div className="master-list-row" key={row.id}>
                <div className="master-list-main">
                  <strong>{row.name}</strong>
                  <span>MRP · Net rate adjusts from selected discount (30%–60%)</span>
                </div>
                <div className="master-row-right">
                  <span className="master-list-value">{formatINR(row.mrp)}</span>
                  <button
                    type="button"
                    className="icon-mini-btn"
                    title="Edit medicine"
                    aria-label={`Edit ${row.name}`}
                    onClick={() =>
                      setMedicine({ id: row.id, name: row.name, mrp: String(row.mrp) })
                    }
                  >
                    <PencilIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-mini-btn danger"
                    title="Delete medicine"
                    aria-label={`Delete ${row.name}`}
                    onClick={() => props.onDeleteMedicine(row.id)}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {props.busyLabel ? <BusyOverlay label={props.busyLabel} /> : null}
    </>
  );
}
