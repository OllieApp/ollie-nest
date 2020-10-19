import { WEEK_DAY } from './../dto/weekday.model';
import { defaultSchedule, timeFormat } from './../constants';
import PractitionerSchedule from './../entities/practitioner-schedule.entity';
import { PractitionerScheduleDto } from '../dto/practitioner-schedule.dto';
import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { areIntervalsOverlapping, toDate, format, parse } from 'date-fns';

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
                start: parse(currentSchedule.startTime, timeFormat, new Date()),
                end: parse(currentSchedule.endTime, timeFormat, new Date()),
              },
              {
                start: parse(schedule.startTime, timeFormat, new Date()),
                end: parse(schedule.endTime, timeFormat, new Date()),
              },
            )
          ) {
            throw new UnprocessableEntityException({
              message:
                'In the schedule collection times for the same day cannot overlap.',
            });
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

  async getSchedulesForDayOfWeek(
    practitionerId: string,
    dayOfWeek: WEEK_DAY,
  ): Promise<PractitionerSchedule[]> {
    try {
      return (
        (await this.schedulesRepository.find({
          where: { dayOfWeek: dayOfWeek, practitionerId },
        })) ?? []
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Could not retrieve the schedules from the database',
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

          const startTime = parse(
            schedule.startTime,
            timeFormat,
            dateReference,
          );
          const endTime = parse(schedule.endTime, timeFormat, dateReference);
          if (startTime > endTime) {
            throw new Error('The start time cannot be after the end time');
          }

          return this.schedulesRepository.create({
            practitionerId,
            dayOfWeek,
            startTime: format(startTime, timeFormat),
            endTime: format(endTime, timeFormat),
          });
        }),
      );
    });

    return mappedSchedules;
  }
}
