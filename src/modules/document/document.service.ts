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
        folders: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
        items: {
          where: { folderId: null },
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
    let folderId = data.folderId || null;
    let folderName = data.folder || null;

    if (!folderId && folderName) {
      // Find or create folder by name
      let folderRecord = await this.prisma.documentFolder.findFirst({
        where: { name: folderName, sectionId: data.sectionId },
      });

      if (!folderRecord) {
        const maxOrderFolder = await this.prisma.documentFolder.findFirst({
          where: { sectionId: data.sectionId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const nextFolderOrder = (maxOrderFolder?.order ?? -1) + 1;

        folderRecord = await this.prisma.documentFolder.create({
          data: {
            name: folderName,
            sectionId: data.sectionId,
            order: nextFolderOrder,
          },
        });
      }
      folderId = folderRecord.id;
    }

    // Assign order = max current order + 1 within the folder or root section
    const maxOrderDoc = await this.prisma.document.findFirst({
      where: { 
        sectionId: data.sectionId,
        folderId: folderId,
      },
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
        folderId: folderId,
        order: nextOrder,
        sectionId: data.sectionId,
      },
    });
  }

  async updateDocument(id: string, data: UpdateDocumentDto) {
    const updateData: any = {
      title: data.title,
      type: data.type,
      classified: data.classified,
      url: data.url,
      sectionId: data.sectionId,
    };

    if (data.folderId !== undefined) {
      updateData.folderId = data.folderId || null;
    } else if (data.folder !== undefined) {
      // If only folder name is passed, find or create it
      let folderId: string | null = null;
      const folderName = data.folder || null;
      if (folderName && data.sectionId) {
        let folderRecord = await this.prisma.documentFolder.findFirst({
          where: { name: folderName, sectionId: data.sectionId },
        });
        if (!folderRecord) {
          const maxOrderFolder = await this.prisma.documentFolder.findFirst({
            where: { sectionId: data.sectionId },
            orderBy: { order: 'desc' },
            select: { order: true },
          });
          const nextFolderOrder = (maxOrderFolder?.order ?? -1) + 1;
          folderRecord = await this.prisma.documentFolder.create({
            data: {
              name: folderName,
              sectionId: data.sectionId,
              order: nextFolderOrder,
            },
          });
        }
        folderId = folderRecord.id;
      }
      updateData.folderId = folderId;
    }

    return this.prisma.document.update({
      where: { id },
      data: updateData,
    });
  }

  async reorderDocuments(sectionId: string, orderedIds: string[]) {
    // Update each document or folder's order field based on its index in the array
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      
      // Check if it is a folder
      const folderExists = await this.prisma.documentFolder.findFirst({
        where: { id, sectionId },
        select: { id: true },
      });

      if (folderExists) {
        await this.prisma.documentFolder.update({
          where: { id },
          data: { order: index },
        });
      } else {
        await this.prisma.document.update({
          where: { id, sectionId },
          data: { order: index },
        });
      }
    }
    return { success: true };
  }

  async renameFolder(sectionId: string, folderIdOrOldName: string, newName: string) {
    const folder = await this.prisma.documentFolder.findFirst({
      where: {
        OR: [
          { id: folderIdOrOldName, sectionId },
          { name: folderIdOrOldName, sectionId },
        ],
      },
    });

    if (!folder) {
      throw new Error('Không tìm thấy thư mục');
    }

    const updatedFolder = await this.prisma.documentFolder.update({
      where: { id: folder.id },
      data: { name: newName },
    });

    return updatedFolder;
  }

  async deleteFolder(sectionId: string, folderIdOrName: string) {
    const folder = await this.prisma.documentFolder.findFirst({
      where: {
        OR: [
          { id: folderIdOrName, sectionId },
          { name: folderIdOrName, sectionId },
        ],
      },
    });

    if (!folder) {
      throw new Error('Không tìm thấy thư mục');
    }

    const docs = await this.prisma.document.findMany({
      where: { folderId: folder.id, sectionId },
    });

    for (const doc of docs) {
      if (doc.url) {
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
    }

    // Xóa các tài liệu bên trong trước
    await this.prisma.document.deleteMany({
      where: { folderId: folder.id, sectionId },
    });

    // Xóa thư mục
    return this.prisma.documentFolder.delete({
      where: { id: folder.id },
    });
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
