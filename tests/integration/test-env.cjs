const testEnvironment = {
  JWT_SECRET: "brewlite-integration-test-secret",
  VNPAY_TMN_CODE: "BREWLITE-TEST",
  VNPAY_HASH_SECRET: "brewlite-vnpay-integration-secret",
  VNPAY_URL: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  VNPAY_RETURN_URL: "http://127.0.0.1:3001/payments/vnpay-return",
};

Object.assign(process.env, testEnvironment);

module.exports = testEnvironment;
