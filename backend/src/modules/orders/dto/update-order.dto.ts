import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
