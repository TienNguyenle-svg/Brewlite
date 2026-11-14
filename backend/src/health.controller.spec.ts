import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports the API and database as healthy when the database probe succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      db: 'up',
      uptime: expect.any(Number),
    });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('reports the service as unavailable when the database probe fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('database unavailable'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
