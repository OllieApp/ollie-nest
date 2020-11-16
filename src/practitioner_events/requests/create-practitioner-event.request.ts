import {
  IsBoolean,
  IsHexColor,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreatePractitionerEventRequest {
  @IsNotEmpty()
  practitionerId: string;

  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @MaxLength(1500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  hexColor?: string;

  @IsOptional()
  @MaxLength(250)
  location?: string;

  @IsISO8601({ strict: true })
  startTime: string;

  @IsISO8601({ strict: true })
  endTime: string;

  @IsBoolean()
  isConfirmed: boolean;

  @IsBoolean()
  isAllDay: boolean;
}
