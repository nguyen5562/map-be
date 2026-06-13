import { Injectable, Logger } from '@nestjs/common';
import sharp = require('sharp');
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ActiveUserData } from '../../common/interfaces/active-user-data.interface';

const MAP_TILES_DIR = './uploads/maptiles';

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(MAP_TILES_DIR)) {
      fs.mkdirSync(MAP_TILES_DIR, { recursive: true });
    }
  }

  async getAllMaps(user: ActiveUserData) {
    if (user.role !== 'admin') {
      return this.prisma.map.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return this.prisma.map.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMapById(id: string) {
    return this.prisma.map.findUnique({
      where: { id }
    });
  }

  async processUploadedMap(file: Express.Multer.File, userId?: string) {
    const mapId = file.filename.split('.')[0];
    const name = file.originalname;

    const newMap = await this.prisma.map.create({
      data: {
        id: mapId,
        name,
        status: 'processing',
        userId: userId || null,
      }
    });

    // Process in background
    this.extractAndTile(file.path, mapId).catch(err => {
       this.logger.error(`Error processing map ${mapId}`, err);
       this.updateMapStatus(mapId, 'error');
    });

    return newMap;
  }

  async updateMap(id: string, data: { name: string }) {
    return this.prisma.map.update({
      where: { id },
      data: { name: data.name }
    });
  }

  async deleteMap(id: string) {
    // 1. Delete from Database
    const map = await this.prisma.map.delete({
      where: { id }
    });

    // 2. Clean up maptiles directory
    const tileDir = path.join(MAP_TILES_DIR, id);
    if (fs.existsSync(tileDir)) {
      try {
        fs.rmSync(tileDir, { recursive: true, force: true });
      } catch (err) {
        this.logger.error(`Failed to delete tile directory for map ${id}`, err);
      }
    }

    // 3. Clean up raw map files
    const rawDir = './uploads/raw_maps';
    if (fs.existsSync(rawDir)) {
      try {
        const files = fs.readdirSync(rawDir);
        const rawFile = files.find(f => f.startsWith(id));
        if (rawFile) {
          fs.unlinkSync(path.join(rawDir, rawFile));
        }
      } catch (err) {
        this.logger.error(`Failed to delete raw file for map ${id}`, err);
      }
    }

    return map;
  }

  private async updateMapStatus(mapId: string, status: string, additionalData: Prisma.MapUpdateInput = {}) {
    try {
       await this.prisma.map.update({
         where: { id: mapId },
         data: { status, ...additionalData }
       });
    } catch (error) {
       this.logger.error('Failed to update status', error);
    }
  }

  async extractAndTile(filePath: string, mapId: string) {
    this.logger.log(`Starting processing map: ${mapId}`);
    const outputDir = path.join(MAP_TILES_DIR, mapId);

    // Get original metadata
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    const maxDim = Math.max(width || 0, height || 0);
    let maxNativeZoom = 0;
    if (maxDim > 0) {
        maxNativeZoom = Math.ceil(Math.log2(maxDim / 256));
    }

    // Generate Tiles
    await sharp(filePath)
      .png({ quality: 80 })
      .tile({
        size: 256,
        layout: 'google',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputDir);

    this.logger.log(`Completed processing map: ${mapId}`);
    await this.updateMapStatus(mapId, 'ready', {
      width,
      height,
      maxNativeZoom
    });
  }

  async saveCalibration(mapId: string, calibrationData: Prisma.InputJsonValue) {
    return this.prisma.map.update({
      where: { id: mapId },
      data: { calibration: calibrationData }
    });
  }
}
