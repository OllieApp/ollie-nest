import { WEEK_DAY } from './weekday.model';
export class PractitionerScheduleDto {
  daysOfWeek: WEEK_DAY[];
  startTime: string;
  endTime: string;
}
