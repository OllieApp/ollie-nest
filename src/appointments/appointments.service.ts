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
import {
  addDays,
  addMinutes,
  areIntervalsOverlapping,
  isAfter,
  isBefore,
  isWithinInterval,
  subDays,
  subHours,
} from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { APPOINTMENT_STATUS } from './dto/appointment-status.dto';

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
    const endTime = addMinutes(startTime, appointmentIntervalInMin);
    if (isBefore(request.startTime, new Date())) {
      throw new BadRequestException({
        message: 'The start time cannot be before the current time.',
      });
    }

    // we add +1 because sunday is 0 and we store sunday as 1
    const currentDayOfWeek = startTime.getUTCDay() + 1;
    const schedules: Array<PractitionerSchedule> = [];
    schedules.push(
      ...(await this.practitionerSchedulesService.getSchedulesForDayOfWeek(
        practitionerId,
        currentDayOfWeek,
      )),
    );

    const isAppointmentBetweenScheduleTimes = (
      appointmentStart: Date,
      appointmentEnd: Date,
      scheduleStart: Date,
      scheduleEnd: Date,
    ): boolean => {
      const sStart = new Date(
        appointmentStart.getUTCFullYear(),
        appointmentStart.getUTCMonth(),
        appointmentStart.getUTCDate(),
        scheduleStart.getUTCHours(),
        scheduleStart.getUTCMinutes(),
      );
      const sEnd = addMinutes(
        sStart,
        this.calculateMinuteDifferenceBetweenTimes(
          { hour: sStart.getUTCHours(), minute: sStart.getUTCMinutes() },
          {
            hour: scheduleEnd.getUTCHours(),
            minute: scheduleEnd.getUTCMinutes(),
          },
        ),
      );

      const scheduleInterval = {
        start: sStart,
        end: sEnd,
      };
      if (
        isWithinInterval(appointmentStart, scheduleInterval) &&
        isWithinInterval(appointmentEnd, scheduleInterval) &&
        areIntervalsOverlapping(
          { start: appointmentStart, end: appointmentEnd },
          { start: sStart, end: sEnd },
          { inclusive: true },
        )
      ) {
        return true;
      }
      return false;
    };

    // check if the found schedules for the selected
    const timesFitCurrentDayOfWeek = schedules.some(s =>
      isAppointmentBetweenScheduleTimes(
        startTime,
        endTime,
        s.startTime,
        s.endTime,
      ),
    );
    if (!timesFitCurrentDayOfWeek) {
      // we check here if the start and end time of the appointment
      // might fit into the previous day of the week

      // we start with Sunday, and Sunday is represented by 0 in DateTime in JS, so if it is a Sunday,
      // then the previous day is a Saturday, which is a 7 or WEEK_DAY.Saturday in our representation.
      // if it is not a Sunday, then we keep the same numbering without adding or substracting, because in
      // DateTime in JS, day of week numbering starts from 0, so if a 1 is a Monday in JS, a 1 in our
      // representation will be a Sunday, a 2 in DateTime JS will be a Tuesday, and Monday in our representation
      // and so on..
      const previousDayOfWeek: number =
        startTime.getUTCDay() === 0 ? WEEK_DAY.Saturday : startTime.getUTCDay();
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
      const timesFitPreviousDayOfWeek = schedules.some(s =>
        isAppointmentBetweenScheduleTimes(
          startTime,
          endTime,
          s.startTime,
          s.endTime,
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
            appointmentStart: startTime.toISOString(),
            appointmentEnd: endTime.toISOString(),
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
          currentDate: subDays(startTime, 1).toISOString(),
        })
        .andWhere('ap.start_time <= :currentDate::timestamptz', {
          currentDate: addDays(endTime, 1).toISOString(),
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
      startTime,
      endTime,
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

    if (isAfter(new Date(), subHours(appointment.startTime, 2))) {
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
}

interface DayTime {
  hour: number;
  minute: number;
}