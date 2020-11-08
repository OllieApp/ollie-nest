export interface PractitionerVideoAppointmentDetailsPayload {
  practitioner: PractitionerPayload;
  user: UserPayload;
  roomUrl?: string;
  startTime: string;
}

interface PractitionerPayload {
  title: string;
}

interface UserPayload {
  firstName: string;
  lastName: string;
}
