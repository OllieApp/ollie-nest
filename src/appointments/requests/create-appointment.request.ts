export class CreateAppointmentRequest {
  public practitionerId: string;
  public userNotes?: string;
  public startTime: Date;
  public isVirtual: boolean;
}
