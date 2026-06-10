import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async getSections() {
    return this.prisma.documentSection.findMany({
      include: {
        items: true,
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
        accent: data.accent || 'emerald',
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
        accent: data.accent,
      },
    });
  }

  async removeSection(id: string) {
    return this.prisma.documentSection.delete({
      where: { id },
    });
  }

  async createDocument(data: any) {
    return this.prisma.document.create({
      data: {
        title: data.title,
        type: data.type,
        classified: data.classified || false,
        url: data.url,
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

  async removeDocument(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
