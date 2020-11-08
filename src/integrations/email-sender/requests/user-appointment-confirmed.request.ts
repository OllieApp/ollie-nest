import { PRACTITIONER_CATEGORY } from 'src/practitioners/dto/category.dto';

export interface UserAppointmentConfirmedRequest {
  userFirstName: string;
  practitionerTitle: string;
  practitionerCategory: PRACTITIONER_CATEGORY;
  practitionerAddress: string;
  practitionerAvatarUrl: string;
  appointmentStartTime: Date;
  isVirtual: boolean;
  userNotes?: string;
}
