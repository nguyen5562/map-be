import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async create(data: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        id: data.id,
        name: data.name,
        desc: data.desc,
        l: data.l,
        r: data.r,
        t: data.t,
        materials: data.materials,
        unit: data.unit,
      },
    });
  }

  async update(id: string, data: UpdateVehicleDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: data.name,
        desc: data.desc,
        l: data.l,
        r: data.r,
        t: data.t,
        materials: data.materials,
        unit: data.unit,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
