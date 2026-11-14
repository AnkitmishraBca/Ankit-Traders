import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 17, children, ...rest }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Base>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M4 8.5h16" />
      <circle cx="16.5" cy="13.5" r="1.2" />
    </Base>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H7.3A3.3 3.3 0 0 0 4 18.3V20" />
      <circle cx="10" cy="7.5" r="3.5" />
      <path d="M16.3 4.2a3.5 3.5 0 0 1 0 6.7M20 20v-1.7a3.3 3.3 0 0 0-2.4-3.2" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </Base>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.2h9L17.5 7M10.2 10.5v5.6M13.8 10.5v5.6" />
    </Base>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
    </Base>
  );
}

export function RupeeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 5h12M6 9h12M8 5c5.3 0 5.3 8 0 8H6l9 8" />
    </Base>
  );
}

export function PillIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10.5 3.5H17a4 4 0 0 1 0 8h-6.5a4 4 0 0 1 0-8Z" transform="rotate(-45 13.75 7.5)" />
      <path d="m8.2 11.8 5.6 5.6M6 14l4 4" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.8v10.4M8.2 10.6 12 14.4l3.8-3.8M4.8 19.4h14.4" />
    </Base>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 9.2V4h10v5.2" />
      <path d="M5 9.2h14a2 2 0 0 1 2 2v4.4a2 2 0 0 1-2 2h-2" />
      <path d="M7 17.6H5a2 2 0 0 1-2-2v-4.4a2 2 0 0 1 2-2" />
      <path d="M7 14.2h10V20H7z" />
    </Base>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m5.5 17 4.2-5 3 3.2 2.1-2 3.7 4.1" />
      <circle cx="9" cy="9.4" r="1.3" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 19.5h4L20 8l-4-4L4.5 15.5v4Z" />
      <path d="m14.5 5.5 4 4" />
    </Base>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.8v11.4M8.2 7.6 12 3.8l3.8 3.8" />
      <path d="M5.2 14.6v4.6a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1v-4.6" />
    </Base>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 11.6a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.6Z" />
      <path d="M9 9.2c0 3 2.2 5.2 5.2 5.2.5 0 .9-.4.9-.9v-.8l-1.7-.7-.8.9a4.6 4.6 0 0 1-1.9-1.9l.9-.8-.7-1.7h-.9c-.5 0-1 .4-1 .9Z" />
    </Base>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 4.8h11L19.2 8v11.2H5z" />
      <path d="M8.4 4.8v4.4h6.4V4.8M8.4 19.2v-5h7.2v5" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 12.6 4.4 4.4L19 7.4" />
    </Base>
  );
}
