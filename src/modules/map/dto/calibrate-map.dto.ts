import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CalibrateMapDto {
  @IsString()
  @IsNotEmpty({ message: 'mapId không được để trống' })
  mapId: string;

  @IsObject()
  @IsNotEmpty({ message: 'Dữ liệu hiệu chuẩn không được để trống' })
  calibrationData: Record<string, any>;
}
