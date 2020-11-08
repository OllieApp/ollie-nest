export interface PractitionerAppointmentReceivedRequest {
  practitionerTitle: string;
  userFirstName: string;
  userLastName: string;
  userAvatarUrl?: string;
  userNotes?: string;
  isVirtual: boolean;
  appointmentStartTime: Date;
}
