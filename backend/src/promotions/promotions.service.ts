import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PROMOTION_RESERVED_STATUSES,
  SUCCESSFUL_ORDER_STATUSES,
} from '../discounts/discounts.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

/**
 * Mã cũ đã tắt bị đổi tên thành `<CODE>~<id>` để nhường code cho mã mới.
 * Ký tự "~" không nằm trong ký tự cho phép của code nên không bao giờ trùng mã thật.
 */
const ARCHIVED_CODE_MARK = '~';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    const code = dto.code.trim().toUpperCase();
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const expiredAt = dto.expiredAt ? new Date(dto.expiredAt) : null;

    this.assertRules({
      type: dto.type,
      discount: dto.discount,
      startAt,
      expiredAt,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existed = await tx.promotion.findUnique({ where: { code } });

        if (existed) {
          if (existed.active) {
            throw new ConflictException('Mã giảm giá đã tồn tại');
          }

          // Mã cũ đã tắt: đổi tên để nhường code. Giữ lại bản ghi vì đơn cũ
          // và lịch sử dùng mã vẫn tham chiếu tới nó.
          await tx.promotion.update({
            where: { id: existed.id },
            data: {
              code: `${code}${ARCHIVED_CODE_MARK}${existed.id.slice(0, 8)}`,
            },
          });
        }

        return tx.promotion.create({
          data: {
            code,
            type: dto.type,
            discount: dto.discount,
            minOrder: dto.minOrder ?? 0,
            startAt,
            expiredAt,
            usageLimit: dto.usageLimit ?? null,
          },
        });
      });
    } catch (error) {
      // 2 request tạo cùng code song song: request đến sau bị unique chặn.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Mã giảm giá đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

    const [total, rows] = await Promise.all([
      this.prisma.promotion.count(),
      this.prisma.promotion.findMany({
        orderBy: { code: 'asc' },
        skip,
        take,
      }),
    ]);

    // Đếm theo trạng thái đơn: đã thanh toán = đã dùng, PENDING = đang giữ chỗ.
    // Đơn PAYMENT_FAILED / CANCELLED không chiếm lượt nên không được đếm.
    const grouped = rows.length
      ? await this.prisma.order.groupBy({
          by: ['promotionId', 'status'],
          where: {
            promotionId: { in: rows.map((row) => row.id) },
            status: {
              in: [...SUCCESSFUL_ORDER_STATUSES, ...PROMOTION_RESERVED_STATUSES],
            },
          },
          _count: { _all: true },
        })
      : [];

    const items = rows.map((promotion) => {
      let usedCount = 0;
      let reservedCount = 0;

      for (const group of grouped) {
        if (group.promotionId !== promotion.id) continue;

        if (PROMOTION_RESERVED_STATUSES.includes(group.status)) {
          reservedCount += group._count._all;
        } else {
          usedCount += group._count._all;
        }
      }

      return {
        ...promotion,
        usedCount,
        reservedCount,
        remaining:
          promotion.usageLimit === null
            ? null
            : Math.max(0, promotion.usageLimit - usedCount - reservedCount),
      };
    });

    return { items, total, page: currentPage, limit: take };
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const current = await this.prisma.promotion.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    if (dto.active === true && current.code.includes(ARCHIVED_CODE_MARK)) {
      throw new BadRequestException(
        'Mã này đã được lưu trữ vì đã có mã mới cùng tên, hãy dùng mã mới hoặc tạo mã khác',
      );
    }

    // undefined = không đổi, null = xóa giới hạn
    const startAt =
      dto.startAt === undefined
        ? current.startAt
        : dto.startAt === null
          ? null
          : new Date(dto.startAt);
    const expiredAt =
      dto.expiredAt === undefined
        ? current.expiredAt
        : dto.expiredAt === null
          ? null
          : new Date(dto.expiredAt);
    const usageLimit =
      dto.usageLimit === undefined ? current.usageLimit : dto.usageLimit;

    this.assertRules({
      type: current.type,
      discount: dto.discount ?? current.discount,
      startAt,
      expiredAt,
    });

    if (usageLimit !== null) {
      const occupied = await this.prisma.order.count({
        where: {
          promotionId: id,
          status: {
            in: [...SUCCESSFUL_ORDER_STATUSES, ...PROMOTION_RESERVED_STATUSES],
          },
        },
      });

      if (usageLimit < occupied) {
        throw new BadRequestException(
          `Số lượng không được nhỏ hơn số lượt đang chiếm (${occupied}: đã dùng và đang giữ chỗ)`,
        );
      }
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.minOrder !== undefined && { minOrder: dto.minOrder }),
        ...(dto.active !== undefined && { active: dto.active }),
        startAt,
        expiredAt,
        usageLimit,
      },
    });
  }

  /** Xóa mềm: giữ lại bản ghi vì đơn hàng cũ còn tham chiếu tới mã. */
  async remove(id: string) {
    const current = await this.prisma.promotion.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: { active: false },
    });
  }

  private assertRules(rules: {
    type: string;
    discount: number;
    startAt: Date | null;
    expiredAt: Date | null;
  }) {
    if (rules.type === 'PERCENT' && rules.discount > 100) {
      throw new BadRequestException('Giảm theo % không được vượt quá 100');
    }

    if (rules.startAt && rules.expiredAt && rules.startAt >= rules.expiredAt) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }
  }
}