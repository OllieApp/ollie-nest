import {
  IsBoolean,
  IsHexColor,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdatePractitionerEventRequest {
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @MaxLength(1500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  hexColor?: string;

  @IsOptional()
  @MaxLength(250)
  location?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  startTime?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}
