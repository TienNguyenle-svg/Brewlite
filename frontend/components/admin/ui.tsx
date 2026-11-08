'use client';

// frontend/components/admin/ui.tsx
// Các thành phần giao diện dùng chung cho khu vực Admin (theo thiết kế Figma).

import { useState, type ReactNode } from 'react';

// ===== Lớp CSS dùng chung =====
const inputBase =
  'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#39281F] outline-none transition-colors placeholder:text-[#A39A92] focus:border-[#39281F]';
export const fieldClass = (bad = false) =>
  `${inputBase} ${bad ? 'border-[#D6574F] focus:border-[#D6574F]' : 'border-[#E7E1DA]'}`;

// Ô lọc / tìm kiếm ở thanh công cụ (cao 40px). Tự thêm padding ngang khi dùng.
export const filterBase =
  'h-10 rounded-xl border border-[#E7E1DA] bg-white text-sm text-[#39281F] outline-none transition-colors focus:border-[#39281F]';

export const btnPrimary =
  'rounded-[10px] bg-[#39281F] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2b1e17] disabled:cursor-not-allowed disabled:bg-[#A89B90]';
export const btnOutline =
  'rounded-[10px] border border-[#E7E1DA] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-60';
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
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </Svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Svg>
);

// ===== Badge (viên thuốc) =====
const TONES = {
  success: 'bg-[#EAF2EC] text-[#41705A]',
  danger: 'bg-[#FDEFEE] text-[#C0443B]',
  warning: 'bg-[#FAEAD7] text-[#B9672B]',
  dark: 'bg-[#39281F] text-white',
  neutral: 'bg-[#EEE2D2] text-[#39281F]',
} as const;
export type Tone = keyof typeof TONES;

export function Badge({
  tone,
  dot = false,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ===== Tiêu đề trang =====
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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-[#82776E]">{subtitle}</p>}
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
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E7E1DA] bg-white p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-[#82776E]">
        <span>{label}</span>
        <span className="text-[#B9672B]">{icon}</span>
      </div>
      <p className="text-[28px] font-semibold leading-none">{value}</p>
      <p className="mt-3 text-xs text-[#82776E]">{hint}</p>
    </div>
  );
}

// ===== Ô tìm kiếm =====
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-[260px]">
      <SearchIcon
        size={15}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82776E]"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${filterBase} w-full pl-9 pr-3.5 placeholder:text-[#A39A92]`}
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
  noun,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  noun: string;
  onChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Hiển thị tối đa 5 số trang quanh trang hiện tại
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const btn =
    'flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs transition-colors';

  return (
    <div className="flex items-center justify-between border-t border-[#E7E1DA] px-5 py-3.5 text-xs text-[#82776E]">
      <span>
        Hiển thị {from}–{to} trong tổng số {total} {noun}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className={`${btn} border-transparent disabled:opacity-40`}
          >
            <ChevronLeftIcon size={14} />
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`${btn} ${
                p === page
                  ? 'border-[#39281F] bg-[#39281F] text-white'
                  : 'border-[#E7E1DA] bg-white text-[#39281F] hover:bg-[#F8F5F0]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            aria-label="Trang sau"
            disabled={page >= pageCount}
            onClick={() => onChange(page + 1)}
            className={`${btn} border-transparent disabled:opacity-40`}
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Hộp thoại =====
export function Modal({
  children,
  onClose,
  width = 640,
}: {
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ===== Trường nhập có nhãn + dòng lỗi =====
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
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-[#D6574F]">{error}</p>}
    </label>
  );
}

// ===== Hộp báo lỗi =====
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#F5CFCB] bg-[#FDEFEE] px-3 py-3 text-xs text-[#C0443B]"
    >
      {children}
    </div>
  );
}

// ===== Skeleton khi đang tải bảng =====
export function TableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F1ECE5]" />
      ))}
    </div>
  );
}

// ===== Thông báo nhỏ góc dưới phải =====
export function useToast() {
  const [message, setMessage] = useState('');
  function show(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }
  return { message, show };
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-[10px] bg-[#39281F] px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}