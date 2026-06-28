import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimulationSessionDto } from './dto/create-simulation-session.dto';
import { UpdateSimulationSessionDto } from './dto/update-simulation-session.dto';

const MAX_SESSIONS_PER_USER = 20;

@Injectable()
export class SimulationSessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách phương án của user (chỉ trả metadata, không trả data).
   */
  async getAll(userId: string, mapId?: string) {
    return this.prisma.simulationSession.findMany({
      where: {
        userId,
        ...(mapId ? { mapId } : {}),
      },
      select: {
        id: true,
        name: true,
        mapId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết 1 phương án (bao gồm data) để tải về.
   * Chỉ owner mới được đọc.
   */
  async getById(id: string, userId: string) {
    const session = await this.prisma.simulationSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phương án');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập phương án này');
    }

    return session;
  }

  /**
   * Tạo phương án mới.
   * Kiểm tra giới hạn MAX_SESSIONS_PER_USER trước khi tạo.
   */
  async create(userId: string, dto: CreateSimulationSessionDto) {
    const count = await this.prisma.simulationSession.count({
      where: { userId },
    });

    if (count >= MAX_SESSIONS_PER_USER) {
      throw new BadRequestException(
        `Bạn đã đạt giới hạn ${MAX_SESSIONS_PER_USER} phương án. Vui lòng xóa bớt trước khi lưu thêm.`,
      );
    }

    return this.prisma.simulationSession.create({
      data: {
        name: dto.name,
        mapId: dto.mapId ?? null,
        data: dto.data,
        userId,
      },
      select: {
        id: true,
        name: true,
        mapId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Cập nhật tên hoặc dữ liệu phương án.
   * Chỉ owner mới được sửa.
   */
  async update(id: string, userId: string, dto: UpdateSimulationSessionDto) {
    const session = await this.prisma.simulationSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phương án');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa phương án này');
    }

    return this.prisma.simulationSession.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.data !== undefined && { data: dto.data }),
      },
      select: {
        id: true,
        name: true,
        mapId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Xóa phương án.
   * Chỉ owner mới được xóa.
   */
  async delete(id: string, userId: string) {
    const session = await this.prisma.simulationSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phương án');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa phương án này');
    }

    await this.prisma.simulationSession.delete({ where: { id } });

    return { success: true };
  }
}
