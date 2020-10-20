import { Type } from 'class-transformer';
import { IsDate } from 'class-validator/types/decorator/typechecker/IsDate';

export class CreateAppointmentRequest {
  public practitionerId: string;

  public userNotes?: string;

  @Type(() => Date)
  @IsDate()
  public startTime: Date;

  public isVirtual: boolean;
}
