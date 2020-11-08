export interface UserAppointmentConfirmedPayload {
  user: UserPayload;
  practitioner: PractitionerPayload;
  startTimeLong: string;
  startTimeShort: string;
  isVirtual: boolean;
  userNotes?: string;
}

interface UserPayload {
  firstName: string;
}

interface PractitionerPayload {
  title: string;
  category: string;
  address: string;
  avatarUrl: string;
}
