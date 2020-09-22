import { WEEK_DAY } from './weekday.model';
export interface PractitionerScheduleModel {
  daysOfWeek: WEEK_DAY[];
  startTime: string;
  endTime: string;
}
