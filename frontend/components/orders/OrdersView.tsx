"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelMyOrder,
  getAccessToken,
  getMyOrders,
  getProduct,
  getProducts,
  type CustomerOrder,
} from "@/lib/api";
import { formatOrderCode } from "@/lib/order-code";
import type { ApiProduct } from "@/lib/types";
import { ensureCartHydrated, useCartStore } from "@/lib/cart-store";
import { sizePrice, type SizeId } from "@/lib/pricing";

// ===== KIỂU DỮ LIỆU CỦA GIAO DIỆN =====
// Sau này API trả về dữ liệu dạng khác thì chỉ cần đổi sang dạng này
type UiStatus =
  | "PENDING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type OrderItemView = {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  qty: number;
  size: string;
  toppings: string[];
  toppingIds: string[];
  note?: string;
  lineTotal: number;
};

type OrderView = {
  id: string;
  code: string;
  createdAt: string;
  paidAt: string | null;
  status: UiStatus;
  items: OrderItemView[];
  total: number;
};

type Tab = "active" | "history";

// ===== CẤU HÌNH HIỂN THỊ =====
const ACTIVE_STATUSES: UiStatus[] = [
  "PENDING",
  "PAID",
  "PAYMENT_FAILED",
  "PREPARING",
  "READY",
];

const STATUS_INFO: Record<
  UiStatus,
  { label: string; badge: string; message: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    badge: "bg-orange-100 text-orange-700",
    message: "Đã nhận đơn. Quán sẽ xác nhận với bạn sớm.",
  },
  PAID: {
    label: "Đã thanh toán",
    badge: "bg-emerald-100 text-emerald-800",
    message: "Thanh toán thành công. Đơn hàng đang được xử lý.",
  },
  PAYMENT_FAILED: {
    label: "Thanh toán thất bại",
    badge: "bg-red-100 text-red-700",
    message: "Thanh toán chưa hoàn tất. Vui lòng kiểm tra lại đơn hàng.",
  },
  PREPARING: {
    label: "Đang pha chế",
    badge: "bg-orange-100 text-orange-700",
    message: "Barista đang pha món của bạn.",
  },
  READY: {
    label: "Sẵn sàng nhận",
    badge: "bg-amber-100 text-amber-800",
    message: "Đơn của bạn đã sẵn sàng. Mời bạn ra quầy nhận.",
  },
  COMPLETED: {
    label: "Hoàn thành",
    badge: "bg-emerald-100 text-emerald-800",
    message: "Cảm ơn bạn đã ghé BrewLite.",
  },
  CANCELLED: {
    label: "Đã hủy",
    badge: "bg-red-100 text-red-700",
    message: "Đơn hàng này đã được hủy.",
  },
};

const STEPS = ["Đã xác nhận", "Đang pha chế", "Sẵn sàng nhận", "Đã nhận"];
// Trạng thái nào đang ở bước số mấy (PENDING chưa hiện thanh tiến trình)
const STEP_OF: Partial<Record<UiStatus, number>> = { PREPARING: 2, READY: 3 };

const STORE_ADDRESS = "28 Nguyễn Thiệp, Bến Nghé, Quận 1, TP. Hồ Chí Minh";

// ===== HÀM ĐỊNH DẠNG =====
function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

// "2026-10-14T10:42:00+07:00" -> "14/10/2026 · 10:42"
function formatDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} · ${get("hour")}:${get("minute")}`;
}

// ===== CÁC THÀNH PHẦN NHỎ =====
function Stepper({ current }: { current: number }) {
  return (
    <ol className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-4 py-3">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const isDone = n < current;
        const isCurrent = n === current;

        return (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                isDone
                  ? "bg-orange-700 text-white"
                  : isCurrent
                  ? "bg-orange-600 text-white"
                  : "bg-stone-200 text-gray-500"
              }`}
            >
              {isDone ? "✓" : n}
            </span>
            <span className={isCurrent ? "text-gray-900" : "text-gray-500"}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({
  order,
  busy,
  onReorder,
  onCancel,
  now,
}: {
  order: OrderView;
  busy: boolean;
  onReorder: (order: OrderView) => void;
  onCancel: (order: OrderView) => void;
  now: number;
}) {
  const info = STATUS_INFO[order.status];
  const step = STEP_OF[order.status];
  const isCompleted = order.status === "COMPLETED";
  const paidAtMs = order.paidAt ? Date.parse(order.paidAt) : Number.NaN;
  const preparationOverdue =
    order.status === "PAID" &&
    Number.isFinite(paidAtMs) &&
    now - paidAtMs > 30 * 60 * 1000;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base text-gray-900">Đơn #{order.code}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDateTime(order.createdAt)} · Giao tận nơi
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${info.badge}`}
        >
          {info.label}
        </span>
      </div>

      {step && <Stepper current={step} />}

      <ul className="mt-4 flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-14 w-14 rounded-xl bg-stone-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.qty} × {item.name}
              </p>
              <p className="text-xs text-gray-500">
                {item.size} ·{" "}
                {item.toppings.length > 0
                  ? item.toppings.join(" · ")
                  : "Không topping"}
              </p>
              {item.note && (
                <p className="text-xs text-gray-400">Ghi chú: {item.note}</p>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatVND(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <p
        className={`mt-4 text-xs ${
          order.status === "CANCELLED" ? "text-red-700" : "text-gray-500"
        }`}
      >
        {info.message}
      </p>

      {preparationOverdue && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Đơn hàng đã thanh toán hơn 30 phút nhưng quán chưa bắt đầu pha chế.
          Vui lòng liên hệ BrewLite nếu cần hỗ trợ.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          Tổng tiền{" "}
          <span className="ml-2 text-xl text-gray-900">
            {formatVND(order.total)}
          </span>
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          {isCompleted && (
            <button
              type="button"
              className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-stone-200"
            >
              Xem hóa đơn
            </button>
          )}
          <button
            type="button"
            onClick={() => onReorder(order)}
            disabled={busy}
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              isCompleted
                ? "bg-stone-800 text-white hover:bg-stone-900"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-stone-50"
            }`}
          >
            {busy ? "Đang xử lý..." : "↻ Đặt lại"}
          </button>
          {order.status === "PAID" && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              disabled={busy}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Đang xử lý..." : "Hủy đơn"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function HelpCard() {
  return (
    <div className="rounded-2xl bg-stone-100 p-5">
      <p className="text-sm font-medium text-gray-900">
        Cần hỗ trợ về đơn hàng?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Đội ngũ quán sẵn sàng giúp bạn. Hãy chuẩn bị sẵn mã đơn hàng nhé.
      </p>
      <button
        type="button"
        className="mt-3 text-xs font-medium text-orange-700 hover:underline"
      >
        Chat với quán
      </button>
    </div>
  );
}

// function PickupCard({ order }: { order?: OrderView }) {
//   const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//     STORE_ADDRESS
//   )}`;

//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-5">
//       <p className="text-sm font-medium text-gray-900">Nhận tại quán</p>
//       <p className="mt-3 text-sm text-gray-900">BrewLite · Quận 1</p>
//       <p className="mt-1 text-xs leading-relaxed text-gray-500">
//         {STORE_ADDRESS}
//       </p>

//       {order && (
//         <p className="mt-4 border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500">
//           Đưa mã đơn #{order.code} cho nhân viên tại quầy. Quán sẽ báo khi món
//           của bạn sẵn sàng.
//         </p>
//       )}

//       <a
//         href={mapsUrl}
//         target="_blank"
//         rel="noreferrer"
//         className="mt-4 block rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-stone-50"
//       >
//         Chỉ đường
//       </a>
//     </div>
//   );
// }

function UsualCard({ item }: { item: OrderItemView }) {
  const unitPrice = item.lineTotal / item.qty;

  return (
    <div className="rounded-2xl bg-orange-50 p-5">
      <p className="text-xs uppercase tracking-wide text-orange-700">
        Món quen của bạn
      </p>
      <p className="mt-2 text-xl text-gray-900">
        Vẫn là món quen.
        <br />
        Pha mới mỗi lần.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        {item.name}, {item.size}
        {item.toppings.length > 0 ? `, thêm ${item.toppings.join(" & ")}` : ""}.
      </p>
      {/* Tạm thời nút này chưa có chức năng */}
      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-stone-800 py-3 text-sm font-medium text-white hover:bg-stone-900"
      >
        Đặt món quen · {formatVND(unitPrice)}
      </button>
    </div>
  );
}

function toOrderView(
  order: CustomerOrder,
  productsById: Map<string, ApiProduct>,
  toppingsById: Map<string, string>,
): OrderView {
  return {
    id: order.id,
    code: formatOrderCode(order.id),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: productsById.get(item.productId)?.name ?? "Sản phẩm",
      imageUrl: productsById.get(item.productId)?.imageUrl ?? "/window.svg",
      qty: item.qty,
      size: item.size,
      toppings: item.toppings.map(
        ({ toppingId }) => toppingsById.get(toppingId) ?? "Topping",
      ),
      toppingIds: item.toppings.map(({ toppingId }) => toppingId),
      lineTotal: item.lineTotal,
    })),
    total: order.total,
  };
}

// ===== TRANG CHÍNH =====
export default function OrdersView({ placedId }: { placedId?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const handleReorder = async (order: OrderView) => {
    setBusyOrderId(order.id);
    setActionError(null);

    try {
      await ensureCartHydrated();
      const itemWithToppings = order.items.find(
        (item) => item.toppingIds.length > 0,
      );
      const [products, productWithToppings] = await Promise.all([
        getProducts(),
        itemWithToppings ? getProduct(itemWithToppings.productId) : Promise.resolve(null),
      ]);
      const productsById = new Map(products.map((product) => [product.id, product]));
      const toppingsById = new Map(
        (productWithToppings?.toppings ?? []).map((topping) => [topping.id, topping]),
      );
      const validSizes: SizeId[] = ["S", "M", "L"];

      const itemsToAdd = order.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new Error(`Món “${item.name}” hiện không còn trong thực đơn.`);
        }
        if (!validSizes.includes(item.size as SizeId)) {
          throw new Error(`Size của món “${item.name}” không còn hợp lệ.`);
        }

        const size = item.size as SizeId;
        const toppings = item.toppingIds.map((toppingId) => {
          const topping = toppingsById.get(toppingId);
          if (!topping) {
            throw new Error(`Topping của món “${item.name}” hiện không còn.`);
          }
          return { id: topping.id, name: topping.name, price: topping.price };
        });

        return {
          product,
          size,
          qty: item.qty,
          toppings,
          unitPrice:
            sizePrice(product.price, size) +
            toppings.reduce((total, topping) => total + topping.price, 0),
        };
      });

      const cart = useCartStore.getState();
      for (const item of itemsToAdd) {
        cart.addItem(item.product, item.size, {
          qty: item.qty,
          unitPrice: item.unitPrice,
          toppings: item.toppings,
        });
      }

      router.push("/cart");
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Không thể đặt lại đơn hàng này.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancel = async (order: OrderView) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn #${order.code}?`)) return;

    setBusyOrderId(order.id);
    setActionError(null);
    try {
      const cancelled = await cancelMyOrder(order.id);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, status: cancelled.status as UiStatus }
            : item,
        ),
      );
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Không thể hủy đơn hàng.",
      );
    } finally {
      setBusyOrderId(null);
    }
  };

  useEffect(() => {
    let active = true;
    let refreshing = false;

    const loadOrders = async () => {
      if (!getAccessToken()) {
        setError("Vui lòng đăng nhập để xem đơn hàng của bạn.");
        setLoading(false);
        return;
      }

      try {
        const [customerOrders, products] = await Promise.all([
          getMyOrders(),
          getProducts(),
        ]);
        if (!active) return;

        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );
        const toppingsById = new Map(
          products.flatMap((product) =>
            (product.toppings ?? []).map(
              (topping) => [topping.id, topping.name] as const,
            ),
          ),
        );
        const firstItemWithToppings = customerOrders
          .flatMap((order) => order.items)
          .find((item) => item.toppings.length > 0);

        if (firstItemWithToppings) {
          const productWithToppings = await getProduct(
            firstItemWithToppings.productId,
          );
          if (!active) return;
          for (const topping of productWithToppings.toppings ?? []) {
            toppingsById.set(topping.id, topping.name);
          }
        }

        setOrders(
          customerOrders.map((order) =>
            toOrderView(order, productsById, toppingsById),
          ),
        );
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải danh sách đơn hàng.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const refreshOrderStatuses = async () => {
      if (refreshing) return;
      refreshing = true;

      try {
        const customerOrders = await getMyOrders();
        if (!active) return;

        const ordersById = new Map(
          customerOrders.map((order) => [order.id, order]),
        );
        setOrders((current) =>
          current.map((order) => {
            const latest = ordersById.get(order.id);
            return latest
              ? { ...order, status: latest.status, paidAt: latest.paidAt }
              : order;
          }),
        );
        setSyncError(null);
      } catch (cause) {
        if (active) {
          setSyncError(
            cause instanceof Error
              ? cause.message
              : "Không thể cập nhật trạng thái đơn hàng.",
          );
        }
      } finally {
        refreshing = false;
      }
    };

    void loadOrders();
    const refreshTimer = window.setInterval(() => {
      setNow(Date.now());
      if (getAccessToken()) void refreshOrderStatuses();
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  // Đơn vừa đặt xong (nếu URL có ?placed=...)
  const placedOrder = placedId
    ? orders.find((o) => o.id === placedId || o.code === placedId)
    : undefined;

  const usualItem = historyOrders.find((o) => o.status === "COMPLETED")
    ?.items[0];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "active", label: "Đang xử lý", count: activeOrders.length },
    { id: "history", label: "Đơn đã hủy", count: historyOrders.length },
  ];

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Thanh báo đặt hàng thành công */}
      {placedOrder && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Đặt hàng thành công! Món ngon đang được chuẩn bị.
              </p>
              <p className="text-xs text-gray-500">
                Đơn #{placedOrder.code} đã được ghi nhận. Hẹn gặp bạn tại quầy
                nhận hàng.
              </p>
            </div>
          </div>
          <p className="text-lg text-emerald-800">
            {formatVND(placedOrder.total)}
          </p>
        </div>
      )}

      <p className="text-xs uppercase tracking-wide text-orange-700">
        Khoảnh khắc BrewLite của bạn
      </p>
      <h1 className="mt-1 text-4xl font-medium text-gray-900">
        Đơn hàng của tôi
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Từ ly đầu tiên đến ngụm cuối cùng, theo dõi mọi thứ tại đây.
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {syncError && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {syncError}
        </p>
      )}

      {/* Hai tab */}
      <div className="mt-6 flex gap-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 pb-3 text-sm transition ${
              tab === t.id
                ? "border-b-2 border-orange-600 font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-gray-600">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Cột trái: danh sách đơn */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              Đang tải đơn hàng...
            </p>
          ) : tab === "active" ? (
            activeOrders.length > 0 ? (
              activeOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  busy={busyOrderId === o.id}
                  onReorder={handleReorder}
                  onCancel={handleCancel}
                  now={now}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                Bạn chưa có đơn nào đang xử lý.
              </p>
            )
          ) : (
            <>
              <p className="text-xs text-gray-500">
                {historyOrders.length} đơn đã qua
              </p>
              {historyOrders.length > 0 ? (
                historyOrders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    busy={busyOrderId === o.id}
                    onReorder={handleReorder}
                    onCancel={handleCancel}
                    now={now}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  Bạn chưa có đơn nào trong lịch sử.
                </p>
              )}
            </>
          )}
        </div>

        {/* Cột phải */}
        <aside className="flex flex-col gap-4">
          {/* {tab === "active" ? (
            <PickupCard order={activeOrders[0]} />
          ) : (
            usualItem && <UsualCard item={usualItem} />
          )} */}
          <HelpCard />
        </aside>
      </div>
    </main>
  );
}
