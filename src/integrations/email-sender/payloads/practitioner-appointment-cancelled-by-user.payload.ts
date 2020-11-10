export interface PractitionerAppointmentCancelledByUserPayload {
  practitioner: PractitionerPayload;
  user: UserPayload;
  startTime: string;
}

interface PractitionerPayload {
  title: string;
}

interface UserPayload {
  firstName: string;
  lastName: string;
}
