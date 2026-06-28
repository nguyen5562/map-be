import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSimulationSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phương án không được để trống' })
  name: string;

  @IsOptional()
  @IsString()
  mapId?: string;

  @IsObject()
  @IsNotEmpty({ message: 'Dữ liệu phương án không được để trống' })
  data: Record<string, any>;
}
