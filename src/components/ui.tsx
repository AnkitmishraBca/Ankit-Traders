import type { ReactNode } from "react";
import { ChevronIcon } from "@/components/icons";

export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={`panel-card ${className}`.trim()}>{children}</section>;
}

export function PanelHeading({
  title,
  subtitle,
  chip,
  right,
}: {
  title: string;
  subtitle?: string;
  chip?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right ?? (chip ? <span className="step-chip">{chip}</span> : null)}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  onClick,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      className={`stat-card${interactive ? " stat-card-interactive" : ""}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="stat-top">
        <p className="stat-label">{label}</p>
        <span className="stat-icon">{icon}</span>
      </div>
      <p className="stat-value">
        {value}
        {sub ? <span className="stat-sub">{sub}</span> : null}
      </p>
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}
      {hint ? <small> {hint}</small> : null}
    </label>
  );
}

export function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <div className="doctor-field">
      {children}
      <span className="field-trailing">
        <ChevronIcon size={16} />
      </span>
    </div>
  );
}

export function CountPill({ children }: { children: ReactNode }) {
  return <span className="count-pill">{children}</span>;
}

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div>
        {icon ? <span className="empty-state-icon">{icon}</span> : null}
        <strong>{title}</strong>
        {body ? <p>{body}</p> : null}
      </div>
    </div>
  );
}

export function Toast({ message, tone }: { message: string; tone: "ok" | "error" }) {
  return (
    <div className={`toast${tone === "error" ? " toast-error" : ""}`} role="status">
      {message}
    </div>
  );
}

export function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="export-busy" role="status" aria-live="polite">
      <div className="export-busy-card">
        <span className="spinner" />
        {label}
      </div>
    </div>
  );
}
