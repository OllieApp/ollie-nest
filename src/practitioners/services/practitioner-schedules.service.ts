import { defaultSchedule } from './../constants';
import { PractitionerSchedule } from './../entities/practitioner-schedule.entity';
import { PractitionerScheduleDto } from '../dto/practitioner-schedule.dto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { areIntervalsOverlapping, toDate } from 'date-fns';

@Injectable()
export class PractitionerSchedulesService {
  constructor(
    @InjectRepository(PractitionerSchedule)
    private readonly schedulesRepository: Repository<PractitionerSchedule>,
  ) {}

  async injectDefaultSchedule(
    practitionerId: string,
  ): Promise<PractitionerSchedule[]> {
    try {
      const schedules = this.mapScheduleModelsToScheduleEntities(
        [defaultSchedule],
        practitionerId,
      );
      await this.schedulesRepository.delete({
        practitionerId,
      });

      return await this.schedulesRepository.save(schedules);
    } catch (error) {
      throw new InternalServerErrorException({
        message:
          'Something went wrong while trying to insert the schedule values',
        error: error,
      });
    }
  }

  async replaceCurrentSchedules(
    newSchedules: PractitionerScheduleDto[],
    practitionerId: string,
  ) {
    try {
      const schedules = this.mapScheduleModelsToScheduleEntities(
        newSchedules,
        practitionerId,
      );

      // we run this until the second to last element
      // as there will be nothing to compare with for the last element
      for (let index = 0; index < schedules.length - 1; index++) {
        const currentSchedule = schedules[index];
        const restOfSchedules = schedules.slice(index, length);
        restOfSchedules.forEach(schedule => {
          if (schedule.dayOfWeek != currentSchedule.dayOfWeek) {
            return;
          }

          if (
            areIntervalsOverlapping(
              {
                start: currentSchedule.startTime,
                end: currentSchedule.endTime,
              },
              { start: schedule.startTime, end: schedule.endTime },
            )
          ) {
            throw new Error('In the schedule collection dates cannot overlap.');
          }
        });
      }
      await this.schedulesRepository.delete({
        practitionerId,
      });

      return await this.schedulesRepository.save(schedules);
    } catch (error) {
      throw new InternalServerErrorException({
        message:
          'Something went wrong while trying to insert the schedule values',
        error: error,
      });
    }
  }

  private mapScheduleModelsToScheduleEntities(
    schedules: PractitionerScheduleDto[],
    practitionerId: string,
  ): PractitionerSchedule[] {
    const mappedSchedules = new Array<PractitionerSchedule>();
    const dateReference = new Date();
    schedules.forEach(schedule => {
      mappedSchedules.push(
        ...schedule.daysOfWeek.map(dayOfWeek => {
          if (dayOfWeek < 1 || dayOfWeek > 7) {
            throw new Error(
              'The day of week cannot be smaller than 1 or bigger than 7',
            );
          }

          const startTime = this.parseTimeOfDayToDate(
            schedule.startTime,
            dateReference,
          );
          const endTime = this.parseTimeOfDayToDate(
            schedule.endTime,
            dateReference,
          );
          if (startTime > endTime) {
            throw new Error('The start time cannot be after the end time');
          }

          return this.schedulesRepository.create({
            practitionerId,
            dayOfWeek,
            startTime,
            endTime,
          });
        }),
      );
    });

    return mappedSchedules;
  }

  private parseTimeOfDayToDate(timeOfDay: string, dateReference: Date): Date {
    const timeParts = timeOfDay.split(':');
    if (timeParts.length != 2) {
      throw new Error(
        'The time string does not contain the hour and minutes separated by colon.',
      );
    }
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    if (!hour || !minute) {
      throw new Error('Was not able to parse the time');
    }
    const dateCopy = toDate(dateReference);

    dateCopy.setHours(hour);
    dateCopy.setMinutes(minute);

    return dateCopy;
  }
}
