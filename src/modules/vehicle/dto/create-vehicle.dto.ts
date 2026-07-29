import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã phương tiện không được để trống' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên phương tiện không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsNumber()
  @Type(() => Number)
  l: number;

  @IsNumber()
  @Type(() => Number)
  r: number;

  @IsNumber()
  @Type(() => Number)
  t: number;

  @IsString()
  @IsOptional()
  materials?: string;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @IsBoolean()
  @IsOptional()
  isCar?: boolean;

  @IsOptional()
  consumptionConfig?: any;
}
