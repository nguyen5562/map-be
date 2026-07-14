import { Injectable, BadRequestException } from '@nestjs/common';
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
        isCar: data.isCar ?? false,
      },
    });
  }

  async update(id: string, data: UpdateVehicleDto) {
    // If ID is being changed
    if (data.id && data.id !== id) {
      const newId = data.id;
      // Check if new ID already exists
      const existing = await this.prisma.vehicle.findUnique({
        where: { id: newId },
      });
      if (existing) {
        throw new BadRequestException('Mã khí tài mới đã tồn tại trên hệ thống!');
      }

      // Perform transaction to create new, migrate sessions, and delete old
      return this.prisma.$transaction(async (tx) => {
        // 1. Create new vehicle
        const newVehicle = await tx.vehicle.create({
          data: {
            id: newId,
            name: data.name ?? '',
            desc: data.desc,
            l: data.l ?? 0,
            r: data.r ?? 0,
            t: data.t ?? 0,
            materials: data.materials,
            unit: data.unit ?? 'cái',
            isCar: data.isCar ?? false,
          },
        });

        // 2. Load all sessions to update vehicle ID in JSON
        const sessions = await tx.simulationSession.findMany();
        for (const session of sessions) {
          const sessionData = session.data as any;
          if (sessionData) {
            let updated = false;

            // Update root selectedVehicles
            if (Array.isArray(sessionData.selectedVehicles)) {
              sessionData.selectedVehicles = sessionData.selectedVehicles.map(
                (v: string) => {
                  if (v === id) {
                    updated = true;
                    return newId;
                  }
                  return v;
                },
              );
            }

            // Update root vehicleConfigs
            if (sessionData.vehicleConfigs && sessionData.vehicleConfigs[id]) {
              sessionData.vehicleConfigs[newId] = sessionData.vehicleConfigs[id];
              delete sessionData.vehicleConfigs[id];
              updated = true;
            }

            // Update root vehicleWeights
            if (sessionData.vehicleWeights && sessionData.vehicleWeights[id] !== undefined) {
              sessionData.vehicleWeights[newId] = sessionData.vehicleWeights[id];
              delete sessionData.vehicleWeights[id];
              updated = true;
            }

            // Update pointsList
            if (Array.isArray(sessionData.pointsList)) {
              sessionData.pointsList.forEach((point: any) => {
                if (Array.isArray(point.selectedVehicles)) {
                  point.selectedVehicles = point.selectedVehicles.map(
                    (v: string) => {
                      if (v === id) {
                        updated = true;
                        return newId;
                      }
                      return v;
                    },
                  );
                }
                if (point.vehicleConfigs && point.vehicleConfigs[id]) {
                  point.vehicleConfigs[newId] = point.vehicleConfigs[id];
                  delete point.vehicleConfigs[id];
                  updated = true;
                }
                if (point.vehicleWeights && point.vehicleWeights[id] !== undefined) {
                  point.vehicleWeights[newId] = point.vehicleWeights[id];
                  delete point.vehicleWeights[id];
                  updated = true;
                }
              });
            }

            if (updated) {
              await tx.simulationSession.update({
                where: { id: session.id },
                data: { data: sessionData },
              });
            }
          }
        }

        // 3. Delete old vehicle
        await tx.vehicle.delete({
          where: { id },
        });

        return newVehicle;
      });
    }

    // Normal update
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
        isCar: data.isCar,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
