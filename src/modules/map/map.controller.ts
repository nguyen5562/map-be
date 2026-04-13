import { Controller, Get, Post, Body, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('all')
  getAll() {
    return this.mapService.getAllMaps();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.mapService.getMapById(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMap(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { statusCode: 400, message: 'No file uploaded' };
    }
    return this.mapService.processUploadedMap(file);
  }

  @Post('calibrate')
  calibrateMap(@Body() body: { mapId: string, calibrationData: any }) {
    const updated = this.mapService.saveCalibration(body.mapId, body.calibrationData);
    return { success: true, map: updated };
  }
}
