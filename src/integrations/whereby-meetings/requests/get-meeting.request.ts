import { ExtraFields } from './extra-fields.type';

export class GetMeetingRequest {
  public meetingId: string;
  public fields: Array<ExtraFields>;
}
