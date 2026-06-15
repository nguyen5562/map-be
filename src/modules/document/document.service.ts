import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async getSections(type?: string) {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.prisma.documentSection.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { roman: 'asc' },
    });
  }

  async createSection(data: CreateSectionDto) {
    return this.prisma.documentSection.create({
      data: {
        roman: data.roman,
        title: data.title,
        subtitle: data.subtitle,
        type: data.type || 'document',
      },
    });
  }

  async updateSection(id: string, data: UpdateSectionDto) {
    return this.prisma.documentSection.update({
      where: { id },
      data: {
        roman: data.roman,
        title: data.title,
        subtitle: data.subtitle,
        type: data.type,
      },
    });
  }

  async removeSection(id: string) {
    // Tìm tất cả các tài liệu trong phần này để xóa file vật lý trước
    const docs = await this.prisma.document.findMany({
      where: { sectionId: id },
    });
    for (const doc of docs) {
      if (doc.url) {
        const normalizedPath = doc.url.startsWith('/') ? doc.url.substring(1) : doc.url;
        const filePath = path.join('.', normalizedPath);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            // Bỏ qua lỗi nếu không tìm thấy file hoặc lỗi quyền ghi
          }
        }
      }
    }

    return this.prisma.documentSection.delete({
      where: { id },
    });
  }

  async createDocument(data: CreateDocumentDto) {
    // Assign order = max current order + 1 within the section
    const maxOrderDoc = await this.prisma.document.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (maxOrderDoc?.order ?? -1) + 1;

    return this.prisma.document.create({
      data: {
        title: data.title,
        type: data.type,
        classified: data.classified || false,
        url: data.url,
        order: nextOrder,
        sectionId: data.sectionId,
      },
    });
  }

  async updateDocument(id: string, data: UpdateDocumentDto) {
    return this.prisma.document.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        classified: data.classified,
        url: data.url,
        sectionId: data.sectionId,
      },
    });
  }

  async reorderDocuments(sectionId: string, orderedIds: string[]) {
    // Update each document's order field based on its index in the array
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.document.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
    return { success: true };
  }

  async removeDocument(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });

    if (doc && doc.url) {
      const normalizedPath = doc.url.startsWith('/') ? doc.url.substring(1) : doc.url;
      const filePath = path.join('.', normalizedPath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          // Bỏ qua lỗi
        }
      }
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
