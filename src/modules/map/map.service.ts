import { Injectable, Logger } from '@nestjs/common';
import sharp = require('sharp');
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

const MAP_TILES_DIR = './uploads/maptiles';

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(MAP_TILES_DIR)) {
      fs.mkdirSync(MAP_TILES_DIR, { recursive: true });
    }
  }

  async getAllMaps() {
    return this.prisma.map.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMapById(id: string) {
    return this.prisma.map.findUnique({
      where: { id }
    });
  }

  async processUploadedMap(file: Express.Multer.File) {
    const mapId = file.filename.split('.')[0];
    const name = file.originalname;

    const newMap = await this.prisma.map.create({
      data: {
        id: mapId,
        name,
        status: 'processing',
      }
    });

    // Process in background
    this.extractAndTile(file.path, mapId).catch(err => {
       this.logger.error(`Error processing map ${mapId}`, err);
       this.updateMapStatus(mapId, 'error');
    });

    return newMap;
  }

  private async updateMapStatus(mapId: string, status: string, additionalData: any = {}) {
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

  async saveCalibration(mapId: string, calibrationData: any) {
    return this.prisma.map.update({
      where: { id: mapId },
      data: { calibration: calibrationData }
    });
  }
}
