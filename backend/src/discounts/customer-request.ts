import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: { id?: string; userId?: string; sub?: string; role?: string };
};

/** Lấy ID người dùng từ JWT; requireCustomer = true thì chỉ cho role CUSTOMER. */
export function getUserId(
  req: AuthenticatedRequest,
  requireCustomer = true,
): string {
  if (requireCustomer && req.user?.role !== 'CUSTOMER') {
    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }

  const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;

  if (!userId) {
    throw new BadRequestException(
      'JWT strategy chưa trả về ID người dùng hợp lệ',
    );
  }

  return userId;
}