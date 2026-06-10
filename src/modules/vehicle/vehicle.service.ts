import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.vehicle.create({
      data: {
        id: data.id,
        name: data.name,
        desc: data.desc,
        l: parseFloat(data.l),
        r: parseFloat(data.r),
        t: parseFloat(data.t),
        materials: data.materials,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: data.name,
        desc: data.desc,
        l: data.l !== undefined ? parseFloat(data.l) : undefined,
        r: data.r !== undefined ? parseFloat(data.r) : undefined,
        t: data.t !== undefined ? parseFloat(data.t) : undefined,
        materials: data.materials,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
