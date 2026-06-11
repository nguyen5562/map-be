import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async getSections() {
    return this.prisma.documentSection.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { roman: 'asc' },
    });
  }

  async createSection(data: any) {
    return this.prisma.documentSection.create({
      data: {
        roman: data.roman,
        title: data.title,
        subtitle: data.subtitle,
      },
    });
  }

  async updateSection(id: string, data: any) {
    return this.prisma.documentSection.update({
      where: { id },
      data: {
        roman: data.roman,
        title: data.title,
        subtitle: data.subtitle,
      },
    });
  }

  async removeSection(id: string) {
    return this.prisma.documentSection.delete({
      where: { id },
    });
  }

  async createDocument(data: any) {
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

  async updateDocument(id: string, data: any) {
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
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
