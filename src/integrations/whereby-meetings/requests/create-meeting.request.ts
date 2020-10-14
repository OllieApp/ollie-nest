import { ExtraFields } from './extra-fields.type';

export class CreateMeetingRequest {
  public isLocked: boolean;
  public roomNamePrefix: string;
  public roomMode: 'normal' | 'group';
  public startDate: Date;
  public endDate: Date;
  public fields: Array<ExtraFields>;
}
