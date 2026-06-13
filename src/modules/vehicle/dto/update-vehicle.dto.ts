import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVehicleDto {
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
}
