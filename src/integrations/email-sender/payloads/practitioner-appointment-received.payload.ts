export interface PractitionerAppointmentReceivedPayload {
  practitioner: PractitionerPayload;
  user: UserPayload;
  userNotes?: string;
  isVirtual: boolean;
  startTime: string;
}

interface PractitionerPayload {
  title: string;
}

interface UserPayload {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}
