import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentRequest {
  public practitionerId: string;

  public userNotes?: string;

  @Type(() => Date)
  @IsDate()
  public startTime: Date;

  public isVirtual: boolean;
}
