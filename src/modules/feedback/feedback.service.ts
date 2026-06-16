import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { Subject, Observable } from 'rxjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeedbackService {
  private readonly sseClients = new Map<string, Subject<any>>();

  constructor(private readonly prisma: PrismaService) {}

  getSseObservable(key: string): Observable<any> {
    let client = this.sseClients.get(key);
    if (!client) {
      client = new Subject<any>();
      this.sseClients.set(key, client);
    }
    return client.asObservable();
  }

  private triggerSse(key: string) {
    const client = this.sseClients.get(key);
    if (client) {
      client.next({ time: Date.now() });
    }
  }

  async createFeedback(userId: string, dto: CreateFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
      },
    });

    this.triggerSse('admin');
    return feedback;
  }

  async getMyFeedbacks(userId: string) {
    return this.prisma.feedback.findMany({
      where: { userId },
      include: {
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllFeedbacks() {
    return this.prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(feedbackId: string, status: string) {
    try {
      const result = await this.prisma.feedback.update({
        where: { id: feedbackId },
        data: { status },
      });

      this.triggerSse(result.userId);
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy phản hồi');
      }
      throw error;
    }
  }

  async addReply(userId: string, feedbackId: string, dto: CreateReplyDto, isAdmin: boolean) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!feedback) {
      throw new NotFoundException('Không tìm thấy phản hồi');
    }

    if (!isAdmin && feedback.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền phản hồi yêu cầu này');
    }

    // Tối ưu hóa: Update flags và Create reply trong 1 lần gọi database duy nhất
    const result = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        adminRead: isAdmin ? true : false,
        userRead: isAdmin ? false : true,
        replies: {
          create: {
            userId,
            content: dto.content,
          },
        },
      },
      select: {
        replies: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    const reply = result.replies[0];

    // Notify other party
    if (isAdmin) {
      this.triggerSse(feedback.userId);
    } else {
      this.triggerSse('admin');
    }

    return reply;
  }

  async markAsRead(feedbackId: string, userId: string, isAdmin: boolean) {
    if (isAdmin) {
      try {
        return await this.prisma.feedback.update({
          where: { id: feedbackId },
          data: { adminRead: true },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('Không tìm thấy phản hồi');
        }
        throw error;
      }
    }

    // Nếu không phải admin, kiểm tra quyền sở hữu
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!feedback) {
      throw new NotFoundException('Không tìm thấy phản hồi');
    }
    if (feedback.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập phản hồi này');
    }

    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: { userRead: true },
    });
  }

  async getNotifications(userId: string, isAdmin: boolean) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: isAdmin
        ? { adminRead: false }
        : { userId, userRead: false },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return feedbacks.map(fb => {
      const lastReply = fb.replies[0];
      return {
        id: fb.id,
        title: fb.title,
        type: fb.type,
        status: fb.status,
        updatedAt: fb.updatedAt,
        senderName: fb.user.name || fb.user.username,
        lastMessage: lastReply ? lastReply.content : fb.content,
        lastSenderRole: lastReply ? lastReply.user.role : 'user',
      };
    });
  }
}
