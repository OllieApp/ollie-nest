import { PractitionerScheduleDto } from './dto/practitioner-schedule.dto';
import { WEEK_DAY } from './dto/weekday.model';
// time is UTC
export const defaultSchedule: PractitionerScheduleDto = {
  daysOfWeek: [
    WEEK_DAY.Monday,
    WEEK_DAY.Tuesday,
    WEEK_DAY.Wednesday,
    WEEK_DAY.Thursday,
    WEEK_DAY.Friday,
  ],
  startTime: '07:00',
  endTime: '15:00',
};
export const timeFormat = 'HH:mm';
export const FIREBASE_STORAGE_PRACTITIONERS_AVATARS_BUCKET =
  'gs://practitioners.ollie.health/';
