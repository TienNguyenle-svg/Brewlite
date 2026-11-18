
'use client';

// frontend/components/admin/ui.tsx
// Các thành phần giao diện dùng chung cho khu vực Admin (theo thiết kế Figma).

import { useState, type ReactNode } from 'react';

// ===== Lớp CSS dùng chung =====
const inputBase =
  'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#2F4A3A] outline-none transition-colors placeholder:text-[#87998B] focus:border-[#2F4A3A]';
export const fieldClass = (bad = false) =>
  `${inputBase} ${bad ? 'border-[#D6574F] focus:border-[#D6574F]' : 'border-[#CBD7C8]'}`;

// Ô lọc / tìm kiếm ở thanh công cụ (cao 40px). Tự thêm padding ngang khi dùng.
export const filterBase =
  'h-10 rounded-xl border border-[#CBD7C8] bg-white text-sm text-[#2F4A3A] outline-none transition-colors focus:border-[#2F4A3A]';

export const btnPrimary =
  'rounded-xl bg-[#2F4A3A] px-4 py-2.5 shadow-[0_4px_12px_rgba(47,74,58,0.18)] text-sm font-semibold text-white transition-colors hover:bg-[#243B2D] disabled:cursor-not-allowed disabled:bg-[#A89B90]';
export const btnOutline =
  'rounded-[10px] border border-[#CBD7C8] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#F3EAD8] disabled:cursor-not-allowed disabled:opacity-60';
export const btnDanger =
  'rounded-[10px] bg-[#C0443B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a93a32] disabled:cursor-not-allowed disabled:bg-[#E3A19C]';

// ===== Biểu tượng (SVG) =====
type IconProps = { size?: number; className?: string };

function Svg({
  size = 16,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);
export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Svg>
);
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </Svg>
);
export const CupIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <path d="M6 2v2" />
    <path d="M10 2v2" />
    <path d="M14 2v2" />
  </Svg>
);
export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);
export const BoxIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="M3 7v10l9 5 9-5V7" />
    <path d="M12 12v10" />
  </Svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Svg>
);
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 10 18H2L12 3Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </Svg>
);
export const ReceiptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2Z" />
    <path d="M8 7h8M8 11h8M8 15h5" />
  </Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M7 2v6M17 2v6M3 10h18" />
  </Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12m-5-5 5 5 5-5" />
    <path d="M4 17v4h16v-4" />
  </Svg>
);
export const WalletIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M16 14h3" />
  </Svg>
);
export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
);
export const ArrowUpRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);

// ===== Badge trạng thái =====
export type Tone = 'success' | 'danger' | 'warning' | 'dark' | 'neutral';

const TONES: Record<Tone, string> = {
  success: 'bg-[#E5F2E8] text-[#2F6B45]',
  danger: 'bg-[#FBE9E7] text-[#B7443A]',
  warning: 'bg-[#FFF1D9] text-[#A76622]',
  dark: 'bg-[#E2EBE2] text-[#2F4A3A]',
  neutral: 'bg-[#EEF2EC] text-[#526B59]',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ===== Header trang =====
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-extrabold tracking-tight text-[#2F4A3A]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm font-medium text-[#617466]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ===== Thẻ thống kê =====
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#CBD7C8] bg-white p-5 shadow-[0_6px_18px_rgba(47,74,58,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#617466]">{label}</span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5EDE2] text-[#2F4A3A]">
            {icon}
          </span>
        )}
      </div>
      <p className="text-[28px] font-extrabold leading-tight text-[#2F4A3A]">
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-xs font-medium text-[#617466]">{hint}</p>
      )}
    </div>
  );
}

// ===== Tìm kiếm =====
export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-[320px]">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#617466]">
        <SearchIcon size={16} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${filterBase} w-full pl-10 pr-3`}
      />
    </div>
  );
}

// ===== Phân trang =====
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  noun = 'mục',
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  noun?: string;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#CBD7C8] px-5 py-4 text-sm text-[#617466]">
      <span>
        Hiển thị <strong className="text-[#2F4A3A]">{from}–{to}</strong> trên{' '}
        <strong className="text-[#2F4A3A]">{total}</strong> {noun}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD7C8] bg-white text-[#2F4A3A] hover:bg-[#F3EAD8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="min-w-16 text-center font-semibold text-[#2F4A3A]">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Trang tiếp theo"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD7C8] bg-white text-[#2F4A3A] hover:bg-[#F3EAD8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

// ===== Modal =====
export function Modal({
  children,
  onClose,
  width = 560,
}: {
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14271C]/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[#CBD7C8] bg-white p-6 text-[#2F4A3A] shadow-[0_18px_48px_rgba(20,39,28,0.25)]"
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}

// ===== Nhãn ô nhập liệu =====
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#2F4A3A]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-medium text-[#C0443B]">
          {error}
        </span>
      )}
    </label>
  );
}

// ===== Thông báo lỗi =====
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#F0B8B2] bg-[#FFF0EE] px-4 py-3 text-sm text-[#B7443A]">
      {children}
    </div>
  );
}

// ===== Skeleton bảng =====
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-[#E5EDE2]" />
          <div className="h-3 flex-1 rounded-full bg-[#E5EDE2]" />
          <div className="h-3 w-20 rounded-full bg-[#E5EDE2]" />
        </div>
      ))}
    </div>
  );
}

// ===== Toast =====
export function useToast() {
  const [message, setMessage] = useState('');

  return {
    message,
    show: (text: string) => {
      setMessage(text);
      setTimeout(() => setMessage(''), 3500);
    },
  };
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-[#2F4A3A] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(47,74,58,0.24)]">
      {message}
    </div>
  );
}
