export interface UserAppointmentCancelledByPractitionerPayload {
  user: UserPayload;
  practitioner: PractitionerPayload;
  startTime: string;
}

interface UserPayload {
  firstName: string;
}

interface PractitionerPayload {
  title: string;
}
