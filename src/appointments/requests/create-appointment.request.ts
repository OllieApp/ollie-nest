import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentRequest {
  @IsNotEmpty()
  public practitionerId: string;

  @IsOptional()
  @MaxLength(300)
  public userNotes?: string;

  @IsISO8601()
  public startTime: string;

  @IsNotEmpty()
  @IsBoolean()
  public isVirtual: boolean;
}
