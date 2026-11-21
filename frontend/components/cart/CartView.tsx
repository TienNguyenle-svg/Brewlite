
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLoyalty, getProducts } from "@/lib/api"; // <-- Thêm getProducts
import { getToken, saveSession, useUser } from "@/lib/auth";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import CartItemRow from "./CartItemRow";
import PromoForm from "./PromoForm";

export default function CartView() {
  const cart = useCart();
  const user = useUser();
  const [loyalty, setLoyalty] = useState<{
    userId: string;
    points: number;
  } | null>(null);
  const [loyaltyError, setLoyaltyError] = useState<{
    userId: string;
    message: string;
  } | null>(null);

  // State kiểm tra sản phẩm còn bán hay không
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [checkingProducts, setCheckingProducts] = useState(true);

  // 1. Lấy danh sách sản phẩm đang bán
  useEffect(() => {
    getProducts()
      .then((products) => {
        setAvailableIds(new Set(products.map((p) => p.id)));
      })
      .finally(() => setCheckingProducts(false));
  }, []);

  // 2. Logic lấy điểm thưởng (giữ nguyên)
  useEffect(() => {
    if (!user) return;

    let active = true;
    void (async () => {
      try {
        const summary = await getLoyalty();
        if (!active) return;
        setLoyalty({ userId: user.id, points: summary.availablePoints });
        const token = getToken();
        if (token) {
          saveSession(token, { ...user, loyaltyPoints: summary.availablePoints });
        }
      } catch (error) {
        if (active) {
          setLoyaltyError({
            userId: user.id,
            message:
              error instanceof Error
                ? error.message
                : "Không thể tải điểm thưởng.",
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const loyaltyErrorMessage =
    user && loyaltyError?.userId === user.id ? loyaltyError.message : null;
  const availablePoints =
    user && loyalty?.userId === user.id
      ? loyalty.points
      : (user?.loyaltyPoints ?? 0);
  const loyaltyLoading =
    !!user && loyalty?.userId !== user.id && !loyaltyErrorMessage;
  const canRedeemPoints = availablePoints >= 100;

  // Kiểm tra xem có món nào ngừng bán trong giỏ không
  const hasUnavailableItems = cart.items.some(
    (item) => !availableIds.has(item.productId)
  );

  return (
    <div className="mt-[42px] grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="rounded-[18px] border border-[#D9CBAA] bg-white px-5 pb-8 pt-[26px] sm:px-8">
        <h2 className="pb-[19px] text-xl font-semibold leading-6">
          Số lượng ({cart.count})
        </h2>

        {/* CẢNH BÁO ĐỎ NẾU CÓ MÓN NGỪNG BÁN */}
        {hasUnavailableItems && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Một số món trong giỏ hàng đã ngừng bán. Vui lòng xóa các món được đánh dấu để tiếp tục thanh toán.
          </div>
        )}

        <div className="border-t border-[#E3DACF]">
          {cart.items.length === 0 && (
            <p className="py-10 text-sm text-[#82776E]">Giỏ hàng của bạn đang trống.</p>
          )}
          {cart.items.map((item) => {
            const isUnavailable = !availableIds.has(item.productId);
            return (
              <div key={item.id} className={isUnavailable ? "opacity-60" : ""}>
                <CartItemRow
                  item={item}
                  onSetQty={cart.setQty}
                />
                {isUnavailable && (
                  <p className="-mt-4 mb-4 px-1 text-xs font-semibold text-red-600">
                    (Món này đã ngừng bán)
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-[13px] font-semibold text-[#2F4A3A] hover:underline"
        >
          ← Chọn thêm món
        </Link>
      </section>

      <aside className="rounded-[18px] bg-white p-8">
        <h2 className="text-[21px] font-semibold leading-[25px]">
          Đơn hàng
        </h2>
        {user && (
          <div className="mt-[24px] rounded-xl border border-[#D9CBAA] bg-[#F3EAD8] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#82776E]">
                  Điểm thưởng
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2E1F14]">
                  {loyaltyLoading
                    ? "Đang tải điểm thưởng…"
                    : `${availablePoints} điểm khả dụng`}
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#2E1F14]">
                <input
                  type="checkbox"
                  checked={cart.usePoints && canRedeemPoints}
                  disabled={!canRedeemPoints}
                  onChange={(e) => cart.setUsePoints(e.target.checked)}
                  className="size-[15px] accent-[#2F4A3A]"
                />
                Dùng điểm
              </label>
            </div>
            {loyaltyErrorMessage && (
              <p role="alert" className="mt-2 text-[10px] text-[#A6564F]">
                Không thể cập nhật điểm thưởng: {loyaltyErrorMessage}
              </p>
            )}
            {!canRedeemPoints && (
              <p className="mt-2 text-[10px] text-[#82776E]">
                Cần tối thiểu 100 điểm để đổi thưởng.
              </p>
            )}
          </div>
        )}

        <dl className="mt-[33px] flex flex-col gap-[22px] text-sm">
          <div className="flex justify-between">
            <dt className="text-[#82776E]">Tổng cộng</dt>
            <dd className="font-medium">{money(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#82776E]">Phí vận chuyển</dt>
            <dd className="font-medium">{money(cart.delivery)}</dd>
          </div>
          {cart.promo && (
            <div className="flex justify-between text-[#2F4A3A]">
              <dt>Giảm giá ({cart.promo.code})</dt>
              <dd className="font-medium">−{money(cart.discount)}</dd>
            </div>
          )}
          {cart.usePoints && cart.pointsDiscount > 0 && (
            <div className="flex justify-between text-[#2F4A3A]">
              <dt>Dùng điểm thưởng</dt>
              <dd className="font-medium">−{money(cart.pointsDiscount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-[23px] flex items-center justify-between border-t border-[#D9CBAA] pt-6">
          <span className="text-[17px] font-semibold">Tổng cộng cần thanh toán</span>
          <span className="text-[22px] font-bold">{money(cart.total)}</span>
        </div>

        <PromoForm
          applied={cart.promo}
          onApply={cart.applyPromo}
          onRemove={cart.removePromo}
        />

        {cart.items.length === 0 ? (
          <button
            type="button"
            disabled
            className="mt-[22px] flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#2F4A3A] text-sm font-semibold text-white opacity-50"
          >
            Đặt hàng
          </button>
        ) : hasUnavailableItems ? (
          <button
            type="button"
            disabled
            className="mt-[22px] flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-300 text-sm font-semibold text-gray-500"
          >
            Vui lòng xóa món ngừng bán
          </button>
        ) : (
          <Link
            href="/checkout"
            className="mt-[22px] flex h-12 items-center justify-center rounded-xl bg-[#2F4A3A] text-sm font-semibold text-white transition-colors hover:bg-[#263D2F]"
          >
            Đặt hàng
          </Link>
        )}
        <p className="mt-[21px] text-center text-[11px] text-[#82776E]">
          ♡ Freshly made · Secure checkout
        </p>

        {cart.toFreeDelivery > 0 && cart.items.length > 0 && (
          <div className="mt-[39px] rounded-xl bg-[#F3EAD8] px-[18px] py-3.5">
            <p className="text-[13px] font-semibold">
              Bạn sắp được nhận một phần quà nhỏ á!
            </p>
            <p className="mt-2.5 text-[11px] text-[#82776E]">
              Thêm {money(cart.toFreeDelivery)} để được miễn phí vận chuyển.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
