import { APPOINTMENT_STATUS } from './appointment-status.dto';
export class AppointmentDto {
  public id: string;
  public practitionerId: string;
  public userId: string;
  public createdAt: Date;
  public userNotes?: string;
  public startTime: Date;
  public endTime: Date;
  public status: APPOINTMENT_STATUS;
  public isVirtual: boolean;
  public cancelledByPractitioner: boolean;
  public cancellationReason?: string;
  public reviewId?: string;
  public videoUrl?: string;

  constructor(partial: Partial<AppointmentDto>) {
    Object.assign(this, partial);
  }
}
