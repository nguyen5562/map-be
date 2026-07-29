import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  l?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  r?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  t?: number;

  @IsString()
  @IsOptional()
  materials?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsBoolean()
  @IsOptional()
  isCar?: boolean;

  @IsOptional()
  consumptionConfig?: any;
}
