export interface UserAppointmentCancelledConfirmationPayload {
  user: UserPayload;
  practitioner: PractitionerPayload;
}

interface UserPayload {
  firstName: string;
}

interface PractitionerPayload {
  title: string;
  email: string;
  phone: string;
}
