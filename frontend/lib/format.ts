/** Định dạng tiền VND, ví dụ 95000 -> "95.000₫" */
export const money = (n: number) => `${n.toLocaleString("de-DE")}₫`;
