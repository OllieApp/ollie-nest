export interface InternalAppointmentCreatedPayload {
  isVirtual: boolean;
  startTime: string;
  user: UserPayload;
  practitioner: PractitionerPayload;
}

interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PractitionerPayload {
  title: string;
  email: string;
  phone: string;
}
