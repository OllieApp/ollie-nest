import { UpdatePractitionerEventRequest } from './requests/update-practitioner-event.request';
import { DateTime, Duration } from 'luxon';
import PractitionerEvent from 'src/practitioner_events/entities/practitioner_event.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePractitionerEventRequest } from './requests/create-practitioner-event.request';

@Injectable()
export class PractitionerEventsService {
  constructor(
    @InjectRepository(PractitionerEvent)
    private readonly practitionerEventsRepository: Repository<
      PractitionerEvent
    >,
  ) {}

  async createPractitionerEvent(
    userId: string,
    request: CreatePractitionerEventRequest,
  ): Promise<PractitionerEvent> {
    const {
      isAllDay,
      isConfirmed,
      startTime,
      title,
      description,
      endTime,
      hexColor,
      location,
    } = request;

    const eventStartTime = DateTime.fromISO(startTime).toUTC();
    let eventEndTime = DateTime.fromISO(endTime).toUTC();

    if (eventStartTime < DateTime.utc()) {
      throw new BadRequestException({
        message:
          'The start time of the event can not be before the current date and time.',
      });
    }
    if (eventEndTime <= eventStartTime) {
      throw new BadRequestException({
        message:
          'The end time of the event can not be before or at the same time as the start time.',
      });
    }

    const event = new PractitionerEvent();
    event.title = title;
    event.description = description;
    event.location = location;
    event.hexColor = hexColor;
    event.isConfirmed = isConfirmed;
    event.isAllDay = isAllDay;
    event.practitionerId = request.practitionerId;
    event.createdById = userId;

    if (isAllDay) {
      if (eventEndTime.startOf('day') <= eventStartTime.startOf('day')) {
        eventEndTime = eventStartTime.plus({ days: 1 });
      }

      eventEndTime = eventEndTime
        .set({ hour: eventStartTime.hour, minute: eventStartTime.minute })
        .minus({ seconds: 1 } as Duration);

      event.startTime = eventStartTime.toJSDate();
      event.endTime = eventEndTime.toJSDate();
    } else {
      event.startTime = eventStartTime.toJSDate();
      event.endTime = eventEndTime.toJSDate();
    }

    if (
      isConfirmed &&
      (await this.isIntervalOverlappingAnyEvent(
        request.practitionerId,
        eventStartTime,
        eventEndTime,
      ))
    ) {
      throw new UnprocessableEntityException({
        message: 'The event overlaps with other existing events.',
      });
    }

    try {
      return await this.practitionerEventsRepository.save(event);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to insert the event.',
      });
    }
  }

  async deletePractitionerEvent(eventId: string) {
    try {
      await this.practitionerEventsRepository.delete(eventId);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to delete the event.',
      });
    }
  }

  async getPractitionerEvent(eventId: string): Promise<PractitionerEvent> {
    const event = await this.getPractitionerEventById(eventId);
    if (!event) {
      throw new NotFoundException({ message: 'The event could not be found.' });
    }
    return event;
  }

  /**
   * Checks if the interval composed of the start and end time overlaps with any confirmed event for the specified practitioner
   * @param practitionerId
   * @param startTime
   * @param endTime
   * @param eventId the event id that will be the disregarded when querying for intervals
   */
  async isIntervalOverlappingAnyEvent(
    practitionerId: string,
    startTime: DateTime,
    endTime: DateTime,
    eventId?: string,
  ): Promise<boolean> {
    try {
      const overlappingConfirmedEvent = await this.practitionerEventsRepository
        .createQueryBuilder('ev')
        .where(
          "tstzrange(ev.start_time::timestamptz, ev.end_time::timestamptz, '()') && tstzrange(:eventStart::timestamptz, :eventEnd::timestamptz, '()')",
          {
            eventStart: startTime.toUTC().toISO(),
            eventEnd: endTime.toUTC().toISO(),
          },
        )
        .andWhere('ev.practitioner_id = :practitionerId', {
          practitionerId: practitionerId,
        })
        .andWhere('ev.is_confirmed = TRUE')
        .andWhere('ev.end_time >= current_timestamp')
        .andWhere(eventId ? 'ev.id != :eventId' : '1 = 1', {
          eventId,
        })
        .limit(1)
        .getOne();
      return overlappingConfirmedEvent ? true : false;
    } catch (error) {
      // LOG failure to check events
      throw new InternalServerErrorException({
        message: 'Failed to check for overlapping events.',
      });
    }
  }

  async updatePractitionerEvent(
    eventId: string,
    request: UpdatePractitionerEventRequest,
  ) {
    const {
      title,
      description,
      hexColor,
      startTime,
      endTime,
      isAllDay,
      isConfirmed,
      location,
    } = request;

    const event = await this.getPractitionerEvent(eventId);

    let eventStartTime = DateTime.fromJSDate(event.startTime);
    let eventEndTime = DateTime.fromJSDate(event.endTime);

    if (startTime) {
      eventStartTime = DateTime.fromISO(startTime);
    }
    if (endTime) {
      eventEndTime = DateTime.fromISO(endTime);
    }

    if (eventEndTime <= eventStartTime) {
      throw new BadRequestException({
        message:
          'The end time of the event can not be before or at the same time as the start time.',
      });
    }

    if (title && title.trim().length !== 0) {
      event.title = title;
    }
    if (description) {
      event.description = description;
    }
    if (hexColor) {
      event.hexColor = hexColor;
    }

    if (location) {
      event.location = location;
    }

    event.isConfirmed = isConfirmed ?? event.isConfirmed;
    event.isAllDay = isAllDay ?? event.isAllDay;

    if (event.isAllDay) {
      if (eventEndTime.startOf('day') <= eventStartTime.startOf('day')) {
        eventEndTime = eventStartTime.plus({ days: 1 });
      }

      eventEndTime = eventEndTime
        .set({ hour: eventStartTime.hour, minute: eventStartTime.minute })
        .minus({ seconds: 1 } as Duration);

      event.startTime = eventStartTime.toJSDate();
      event.endTime = eventEndTime.toJSDate();
    } else {
      event.startTime = eventStartTime.toJSDate();
      event.endTime = eventEndTime.toJSDate();
    }

    if (
      event.isConfirmed &&
      (await this.isIntervalOverlappingAnyEvent(
        event.practitionerId,
        eventStartTime,
        eventEndTime,
        event.id,
      ))
    ) {
      throw new UnprocessableEntityException({
        message: 'The event overlaps with other existing events.',
      });
    }

    try {
      return await this.practitionerEventsRepository.save(event);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to update the event.',
      });
    }
  }

  async getPractitionerIdForEventId(eventId: string): Promise<string | null> {
    try {
      const entity: {
        practitioner_id: string;
      } = await this.practitionerEventsRepository
        .createQueryBuilder('event')
        .select(['event.practitioner_id'])
        .where('event.id = :eventId', {
          eventId: eventId,
        })
        .getRawOne();
      if (entity) {
        return entity.practitioner_id;
      }
    } catch (error) {}
    return null;
  }

  private async getPractitionerEventById(
    id: string,
  ): Promise<PractitionerEvent | null> {
    const event = await this.practitionerEventsRepository
      .createQueryBuilder('event')
      .where('event.id = :id', { id })
      .getOne();
    return event ?? null;
  }
}
