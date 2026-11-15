export const formatOrderCode = (orderId: string) =>
  orderId.slice(-6).toUpperCase();
