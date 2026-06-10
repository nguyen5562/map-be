import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { VehicleService } from './vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.vehicleService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.vehicleService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }
}
