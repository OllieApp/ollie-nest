export interface InternalAppointmentCreatedRequest {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  practitionerTitle: string;
  practitionerEmail: string;
  practitionerPhone: string;
  appointmentIsVirtual: boolean;
  appointmentStartTime: Date;
}
