import { PractitionerSchedulesService } from './../practitioners/services/practitioner-schedules.service';
import { WherebyMeetingsService } from './../integrations/whereby-meetings/whereby-meetings.service';
import { WEEK_DAY } from './../practitioners/dto/weekday.model';
import { CreateAppointmentRequest } from './requests/create-appointment.request';
import PractitionerSchedule from './../practitioners/entities/practitioner-schedule.entity';
import Appointment from '../appointments/entities/appointment.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { APPOINTMENT_STATUS } from './dto/appointment-status.dto';
import RRule, { Weekday } from 'rrule';
import { DateTime, Interval } from 'luxon';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly wherebyService: WherebyMeetingsService,
    private readonly practitionerSchedulesService: PractitionerSchedulesService,
  ) {}

  async createAppointment(
    userId: string,
    request: CreateAppointmentRequest,
    appointmentIntervalInMin: number,
  ): Promise<Appointment> {
    const { practitionerId, startTime, isVirtual, userNotes } = request;
    const appointmentStartTime = DateTime.fromJSDate(startTime);
    const appointmentEndTime = appointmentStartTime.plus({
      minutes: appointmentIntervalInMin,
    });
    if (appointmentStartTime < DateTime.utc()) {
      throw new BadRequestException({
        message: 'The start time cannot be before the current time.',
      });
    }

    // we add +1 because sunday is 0 and we store sunday as 1
    const appointmentDayOfWeek: WEEK_DAY = appointmentStartTime.get('weekday');
    const schedules: Array<PractitionerSchedule> = [];
    schedules.push(
      ...(await this.practitionerSchedulesService.getSchedulesForDayOfWeek(
        practitionerId,
        appointmentDayOfWeek,
      )),
    );

    const isAppointmentBetweenScheduleTimes = (
      appointmentStart: DateTime,
      appointmentEnd: DateTime,
      scheduleStart: DateTime,
      scheduleEnd: DateTime,
      appointmentDayOfWeek: WEEK_DAY,
    ): boolean => {
      const rule = this.getRruleForSchedule(
        appointmentDayOfWeek,
        scheduleStart,
        appointmentStart,
      );

      return (
        rule.all().findIndex(generatedScheduleStart => {
          const sStart = DateTime.fromJSDate(generatedScheduleStart);
          const sEnd = sStart.plus({
            minutes: this.calculateMinuteDifferenceBetweenTimes(
              { hour: sStart.get('hour'), minute: sStart.get('minute') },
              {
                hour: scheduleEnd.get('hour'),
                minute: scheduleEnd.get('minute'),
              },
            ),
          });
          const scheduleInterval = Interval.fromDateTimes(sStart, sEnd);
          if (
            scheduleInterval.contains(appointmentStart) &&
            scheduleInterval.contains(appointmentEnd)
          ) {
            return true;
          }
          return false;
        }) != -1
      );
    };

    // check if the found schedules for the selected
    const timesFitCurrentDayOfWeek = schedules.find(s =>
      isAppointmentBetweenScheduleTimes(
        appointmentStartTime,
        appointmentEndTime,
        DateTime.fromISO(s.startTime).set({ weekday: appointmentDayOfWeek }),
        DateTime.fromISO(s.endTime).set({ weekday: appointmentDayOfWeek }),
        appointmentDayOfWeek,
      ),
    );
    if (!timesFitCurrentDayOfWeek) {
      // we check here if the start and end time of the appointment
      // might fit into the previous day of the week

      const previousDayOfWeek: WEEK_DAY =
        appointmentDayOfWeek === WEEK_DAY.Monday
          ? WEEK_DAY.Sunday
          : appointmentDayOfWeek - 1;
      const prevDaySchedules: Array<PractitionerSchedule> = [];
      prevDaySchedules.push(
        ...(await this.practitionerSchedulesService.getSchedulesForDayOfWeek(
          practitionerId,
          previousDayOfWeek,
        )),
      );
      if (prevDaySchedules.length == 0) {
        throw new BadRequestException({
          message:
            'Could not create an appointment because there is no schedule stored for that day of the week.',
        });
      }
      // check if the found schedules for the selected
      const timesFitPreviousDayOfWeek = schedules.find(s =>
        isAppointmentBetweenScheduleTimes(
          appointmentStartTime,
          appointmentEndTime,
          DateTime.fromISO(s.startTime).set({ weekday: previousDayOfWeek }),
          DateTime.fromISO(s.endTime).set({ weekday: previousDayOfWeek }),
          previousDayOfWeek,
        ),
      );

      if (!timesFitPreviousDayOfWeek) {
        throw new UnprocessableEntityException({
          message:
            'Could not add appointment as it does not fit any of the available schedules.',
        });
      }
    }

    // check if there are any appointments overlapping with this one
    let overlappingAppointment: Appointment | null | undefined = null;
    try {
      overlappingAppointment = await this.appointmentRepository
        .createQueryBuilder('ap')
        .where(
          "tstzrange(ap.start_time::timestamptz, ap.end_time::timestamptz, '()') && tstzrange(:appointmentStart::timestamptz, :appointmentEnd::timestamptz, '()')",
          {
            appointmentStart: appointmentStartTime.toISO(),
            appointmentEnd: appointmentEndTime.toISO(),
          },
        )
        .andWhere('ap.practitioner_id = :practitionerId', {
          practitionerId: practitionerId,
        })
        .andWhere('ap.status_id <> :statusId', {
          statusId: APPOINTMENT_STATUS.Cancelled as number,
        })
        .andWhere('ap.status_id <> :statusId', {
          statusId: APPOINTMENT_STATUS.Pending as number,
        })
        .andWhere('ap.start_time >= :appointmentStart::timestamptz', {
          currentDate: appointmentStartTime.plus({ days: -1 }).toISO(),
        })
        .andWhere('ap.start_time <= :currentDate::timestamptz', {
          currentDate: appointmentEndTime.plus({ days: 1 }).toISO(),
        })
        .limit(1)
        .getOne();
    } catch (error) {
      // LOG failure to check appointments
      throw new InternalServerErrorException({
        message:
          'Failed to retrieve the existing appointments to check if there are no overlapping appointments.',
      });
    }

    if (overlappingAppointment) {
      throw new UnprocessableEntityException({
        message: 'The appointment overlaps with other existing appointments.',
      });
    }

    let newAppointment = this.appointmentRepository.create({
      startTime: appointmentStartTime.toUTC().toJSDate(),
      endTime: appointmentEndTime.toUTC().toJSDate(),
      practitionerId,
      isVirtual,
      userNotes,
      userId,
      updatedById: userId,
      statusId: APPOINTMENT_STATUS.Confirmed,
    });
    try {
      newAppointment = await this.appointmentRepository.save(newAppointment);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Could not create the appointment.',
      });
    }
    // create email event for the practitioner and for the user
    // create video links if necessary
    if (newAppointment.isVirtual) {
      const meeting = await this.wherebyService.createMeeting({
        isLocked: true,
        startDate: newAppointment.startTime,
        endDate: newAppointment.endTime,
        roomMode: 'normal',
        roomNamePrefix: `ollie-${newAppointment.id}`,
        fields: ['hostRoomUrl'],
      });

      await this.appointmentRepository.update(newAppointment.id, {
        doctorVideoUrl: meeting.hostRoomUrl,
        userVideoUrl: meeting.roomUrl,
        virtualMeetingId: meeting.meetingId,
      });

      newAppointment.doctorVideoUrl = meeting.hostRoomUrl;
      newAppointment.userVideoUrl = meeting.roomUrl;
      newAppointment.virtualMeetingId = meeting.meetingId;
    }

    return newAppointment;
  }

  async cancelAppointment(
    id: string,
    userId: string,
    cancelledByPractitioner: boolean,
    cancellationReason: string,
  ) {
    if (cancellationReason.trim().length != 50) {
      throw new BadRequestException({
        message: 'The cancellation reason cannot be empty.',
      });
    }

    let appointment: Appointment | null = null;
    try {
      appointment = await this.appointmentRepository.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Could not fetch the appointment from the store.',
      });
    }

    if (
      DateTime.utc() >
      DateTime.fromJSDate(appointment.startTime).plus({ hours: -2 })
    ) {
      throw new UnprocessableEntityException({
        message:
          'Cannot cancel an appointment later than 2 hours before the appointment.',
      });
    }

    if (
      appointment.statusId != APPOINTMENT_STATUS.Confirmed &&
      appointment.statusId != APPOINTMENT_STATUS.Pending
    ) {
      throw new UnprocessableEntityException({
        message: 'Cannot cancel this type of appointment.',
      });
    }

    appointment.statusId = APPOINTMENT_STATUS.Cancelled;
    appointment.cancellationReason = cancellationReason;
    appointment.cancellationTime = new Date();
    appointment.updatedById = userId;
    appointment.cancelledByPractitioner = cancelledByPractitioner;
    appointment.doctorVideoUrl = null;
    appointment.userVideoUrl = null;

    const docVideoUrl = appointment.doctorVideoUrl;
    const userVideoUrl = appointment.userVideoUrl;

    try {
      await this.appointmentRepository.save(appointment);
    } catch (error) {}

    // create cancellation email event for the practitioner and for the user
    // delete video links if necessary

    if (appointment.isVirtual && (docVideoUrl || userVideoUrl)) {
      // cancel links meeting if it is video meeting
      const wasWherebyMeetingDeleted = await this.wherebyService.deleteMeeting({
        meetingId: appointment.virtualMeetingId,
      });
      if (wasWherebyMeetingDeleted) {
        await this.appointmentRepository.update(appointment.id, {
          doctorVideoUrl: null,
          userVideoUrl: null,
          virtualMeetingId: null,
        });
      }
    }
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      return (await this.appointmentRepository.findOne(id)) ?? null;
    } catch (error) {
      return null;
    }
  }

  private calculateMinuteDifferenceBetweenTimes(
    startTime: DayTime,
    endTime: DayTime,
  ): number {
    let minutes = 0;
    if (startTime.hour > endTime.hour) {
      minutes = (24 - startTime.hour) * 60 + endTime.hour * 60;
      minutes += -startTime.minute + endTime.minute;
    } else if (startTime.hour < endTime.hour) {
      minutes = (endTime.hour - startTime.hour) * 60;
      minutes += -startTime.minute + endTime.minute;
    } else {
      if (startTime.minute > endTime.minute) {
        minutes = 24 * 60 - startTime.minute + endTime.minute;
      } else {
        minutes = endTime.minute - startTime.minute;
      }
    }
    return minutes;
  }

  private getRruleForSchedule(
    appointmentDayOfWeek: WEEK_DAY,
    scheduleStart: DateTime,
    appointmentStart: DateTime,
  ): RRule {
    return new RRule({
      freq: RRule.WEEKLY,
      dtstart: appointmentStart
        .startOf('day')
        .plus({ days: -1 })
        .toJSDate(),
      count: 1,
      interval: 1,
      wkst: RRule.SU,
      byweekday: this.mapdayOfWeekToRruleWeekday(appointmentDayOfWeek),
      byhour: [scheduleStart.get('hour')],
      byminute: [scheduleStart.get('minute')],
    });
  }

  private mapdayOfWeekToRruleWeekday(dayOfWeek: WEEK_DAY): Weekday {
    switch (dayOfWeek) {
      case WEEK_DAY.Monday:
        return RRule.MO;
      case WEEK_DAY.Tuesday:
        return RRule.TU;
      case WEEK_DAY.Wednesday:
        return RRule.WE;
      case WEEK_DAY.Thursday:
        return RRule.TH;
      case WEEK_DAY.Friday:
        return RRule.FR;
      case WEEK_DAY.Saturday:
        return RRule.SA;
      case WEEK_DAY.Sunday:
        return RRule.SU;
      default:
        return RRule.MO;
    }
  }
}

interface DayTime {
  hour: number;
  minute: number;
}
