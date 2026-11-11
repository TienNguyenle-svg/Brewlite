import { ForbiddenException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const paymentsService = {
    createPayment: jest.fn(),
    cancelOrder: jest.fn(),
    processVnpayIpn: jest.fn(),
    processVnpayReturn: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'http://localhost:3000' : undefined,
    ),
  };

  const customerReq = {
    user: { id: 'user-1', role: 'CUSTOMER' },
    headers: { 'idempotency-key': 'PAY-1' },
    ip: '127.0.0.1',
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new PaymentsController(
      paymentsService as unknown as PaymentsService,
      configService as unknown as ConfigService,
    );
  });

  it('gọi service với user ID lấy từ JWT và Idempotency-Key', async () => {
    paymentsService.createPayment.mockResolvedValue({
      status: 'PENDING',
      paymentUrl: 'https://sandbox.vnpayment.vn/test',
    });

    const result = await controller.createPayment(
      { orderId: 'order-1' },
      customerReq,
    );

    expect(paymentsService.createPayment).toHaveBeenCalledWith(
      'user-1',
      'order-1',
      'PAY-1',
      '127.0.0.1',
    );
    expect(result.status).toBe('PENDING');
  });

  it('chặn người dùng không phải CUSTOMER khi thanh toán', async () => {
    await expect(
      controller.createPayment(
        { orderId: 'order-1' },
        {
          user: { id: 'admin-1', role: 'ADMIN' },
          headers: { 'idempotency-key': 'PAY-1' },
          ip: '127.0.0.1',
        } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(paymentsService.createPayment).not.toHaveBeenCalled();
  });

  it('khách hủy đơn của chính mình', async () => {
    paymentsService.cancelOrder.mockResolvedValue({
      orderId: 'order-1',
      status: 'CANCELLED',
    });

    const result = await controller.cancelOrder('order-1', customerReq);

    expect(paymentsService.cancelOrder).toHaveBeenCalledWith(
      'user-1',
      'order-1',
    );
    expect(result).toEqual({ orderId: 'order-1', status: 'CANCELLED' });
  });

  it('chặn người dùng không phải CUSTOMER khi hủy đơn', async () => {
    await expect(
      controller.cancelOrder('order-1', {
        user: { id: 'barista-1', role: 'BARISTA' },
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(paymentsService.cancelOrder).not.toHaveBeenCalled();
  });

  it('nhận IPN VNPay qua GET query và chuyển tiếp đến service', async () => {
    const query = {
      vnp_TxnRef: 'transaction-1',
      vnp_ResponseCode: '00',
    };
    const expected = { RspCode: '00', Message: 'Confirm Success' };
    paymentsService.processVnpayIpn.mockResolvedValue(expected);

    await expect(controller.vnpayIpn(query)).resolves.toEqual(expected);

    expect(paymentsService.processVnpayIpn).toHaveBeenCalledWith(query);
    expect(
      Reflect.getMetadata(PATH_METADATA, PaymentsController.prototype.vnpayIpn),
    ).toBe('vnpay-ipn');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        PaymentsController.prototype.vnpayIpn,
      ),
    ).toBe(RequestMethod.GET);
  });

  it('xác minh kết quả rồi chuyển hướng về frontend', async () => {
    paymentsService.processVnpayReturn.mockResolvedValue({
      orderId: 'order-1',
      status: 'success',
    });

    const response = { redirect: jest.fn() };

    await controller.vnpayReturn(
      { vnp_ResponseCode: '00' },
      response as never,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      302,
      'http://localhost:3000/payment/result?status=success&orderId=order-1',
    );
  });
});