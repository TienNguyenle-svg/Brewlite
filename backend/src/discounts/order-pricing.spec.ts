import {
  calcEarnedPoints,
  calcMaxRedeemPoints,
  calcPromotionDiscount,
  getSubtotal,
} from './order-pricing';

describe('order-pricing', () => {
  it('tiền gốc = tổng đang lưu + các khoản đã giảm', () => {
    expect(
      getSubtotal({
        total: 50000,
        discountAmount: 10000,
        pointsDiscount: 40000,
      }),
    ).toBe(100000);
  });

  it('loại phí ship khỏi tiền món khi kiểm tra điều kiện voucher', () => {
    expect(
      getSubtotal({
        total: 95000,
        discountAmount: 10000,
        pointsDiscount: 0,
        shippingFee: 15000,
      }),
    ).toBe(90000);
  });

  describe('calcPromotionDiscount', () => {
    it('PERCENT: 10% của 100.000đ = 10.000đ', () => {
      expect(
        calcPromotionDiscount({ type: 'PERCENT', discount: 10 }, 100000),
      ).toBe(10000);
    });

    it('PERCENT làm tròn giống lúc tạo đơn', () => {
      expect(
        calcPromotionDiscount({ type: 'PERCENT', discount: 10 }, 45500),
      ).toBe(4550);
      expect(
        calcPromotionDiscount({ type: 'PERCENT', discount: 15 }, 45001),
      ).toBe(6750);
      expect(
        calcPromotionDiscount({ type: 'PERCENT', discount: 10 }, 45505),
      ).toBe(4551);
    });

    it('FIXED: giảm đúng số tiền', () => {
      expect(
        calcPromotionDiscount({ type: 'FIXED', discount: 20000 }, 100000),
      ).toBe(20000);
    });
  });

  describe('calcMaxRedeemPoints', () => {
    it('tối đa 50% giá trị đơn, 1 điểm = 1đ', () => {
      expect(calcMaxRedeemPoints(90000)).toBe(45000);
      expect(calcMaxRedeemPoints(100000)).toBe(50000);
    });

    it('luôn chừa lại tối thiểu 5.000đ', () => {
      expect(calcMaxRedeemPoints(8000)).toBe(3000);
      expect(calcMaxRedeemPoints(5000)).toBe(0);
      expect(calcMaxRedeemPoints(0)).toBe(0);
    });
  });

  describe('calcEarnedPoints', () => {
    it('mỗi 1.000đ trọn = 1 điểm, phần lẻ dưới 1.000đ không tính', () => {
      expect(calcEarnedPoints(89000)).toBe(89);
      expect(calcEarnedPoints(35000)).toBe(35);
      expect(calcEarnedPoints(45500)).toBe(45);
      expect(calcEarnedPoints(1000)).toBe(1);
      expect(calcEarnedPoints(999)).toBe(0);
    });
  });
});
