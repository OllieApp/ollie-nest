export interface PractitionerAppointmentCancelledConfirmationPayload {
  practitioner: PractitionerPayload;
  user: UserPayload;
}

interface PractitionerPayload {
  title: string;
}

interface UserPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}
