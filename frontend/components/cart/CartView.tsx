"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLoyalty } from "@/lib/api";
import { getToken, getUser, saveSession } from "@/lib/auth";
import { useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import CartItemRow from "./CartItemRow";
import PromoForm from "./PromoForm";

export default function CartView() {
  const cart = useCart();
  const [availablePoints, setAvailablePoints] = useState<number>(
    getUser()?.loyaltyPoints ?? 0,
  );

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    let active = true;
    void (async () => {
      try {
        const summary = await getLoyalty();
        if (!active) return;
        const nextPoints = summary.availablePoints;
        setAvailablePoints(nextPoints);
        const token = getToken();
        if (token) {
          saveSession(token, { ...user, loyaltyPoints: nextPoints });
        }
      } catch {
        setAvailablePoints(user.loyaltyPoints ?? 0);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const canRedeemPoints = availablePoints >= 100;

  return (
    <div className="mt-[42px] grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="rounded-[18px] border border-[#E3DACF] bg-white px-5 pb-8 pt-[26px] sm:px-8">
        <h2 className="pb-[19px] text-xl font-semibold leading-6">
          Số lượng ({cart.count})
        </h2>
        <div className="border-t border-[#E3DACF]">
          {cart.items.length === 0 && (
            <p className="py-10 text-sm text-[#82776E]">Giỏ hàng của bạn đang trống.</p>
          )}
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} onSetQty={cart.setQty} />
          ))}
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-[13px] font-semibold text-[#B9672B]"
        >
          ← Chọn thêm món
        </Link>
      </section>

      <aside className="rounded-[18px] bg-white p-8">
        <h2 className="text-[21px] font-semibold leading-[25px]">
          Đơn hàng
        </h2>
        {getUser() && (
          <div className="mt-[24px] rounded-xl border border-[#E7E1DA] bg-[#F7F2ED] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#82776E]">
                  Điểm thưởng
                </p>
                <p className="mt-1 text-sm font-semibold text-[#39281F]">
                  {availablePoints} điểm khả dụng
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#39281F]">
                <input
                  type="checkbox"
                  checked={cart.usePoints && canRedeemPoints}
                  disabled={!canRedeemPoints}
                  onChange={(e) => cart.setUsePoints(e.target.checked)}
                  className="size-[15px] accent-[#B9672B]"
                />
                Dùng điểm
              </label>
            </div>
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
            <div className="flex justify-between text-[#406B4A]">
              <dt>Giảm giá ({cart.promo.code})</dt>
              <dd className="font-medium">−{money(cart.discount)}</dd>
            </div>
          )}
          {cart.usePoints && cart.pointsDiscount > 0 && (
            <div className="flex justify-between text-[#406B4A]">
              <dt>Dùng điểm thưởng</dt>
              <dd className="font-medium">−{money(cart.pointsDiscount)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-[23px] flex items-center justify-between border-t border-[#E3DACF] pt-6">
          <span className="text-[17px] font-semibold">Tổng cộng cần thanh toán</span>
          <span className="text-[22px] font-bold">{money(cart.total)}</span>
        </div>

        <PromoForm
          applied={cart.promo}
          onApply={cart.applyPromo}
          onRemove={cart.removePromo}
        />

        <Link
          href="/checkout"
          className="mt-[22px] flex h-12 items-center justify-center rounded-xl bg-[#39281F] text-sm font-semibold text-white"
        >
          Đặt hàng
        </Link>
        <p className="mt-[21px] text-center text-[11px] text-[#82776E]">
          ♡ Freshly made · Secure checkout
        </p>

        {cart.toFreeDelivery > 0 && cart.items.length > 0 && (
          <div className="mt-[39px] rounded-xl bg-[#F2E9DC] px-[18px] py-3.5">
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
