import { UpdatePractitionerEventRequest } from './requests/update-practitioner-event.request';
import {
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
  Request,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  Patch,
  Param,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { PractitionersService } from 'src/practitioners/services/practitioners.service';
import { UsersService } from 'src/users/users.service';
import { PractitionerEventDto } from './dto/practitioner-event.dto';
import { PractitionerEventsService } from './practitioner_events.service';
import { CreatePractitionerEventRequest } from './requests/create-practitioner-event.request';

@Controller('/practitioner-events')
export class PractitionerEventsController {
  private readonly logger = new Logger(PractitionerEventsController.name);
  constructor(
    private readonly practitionersService: PractitionersService,
    private readonly usersService: UsersService,
    private readonly eventsService: PractitionerEventsService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard('firebase'))
  async createPractitionerEvent(
    @Request() req,
    @Body() createEventRequest: CreatePractitionerEventRequest,
  ): Promise<PractitionerEventDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);

    const userPractitionersIds = await this.practitionersService.getPractitionersIdsForUserId(
      user.id,
    );

    if (
      !userPractitionersIds.some(id => id == createEventRequest.practitionerId)
    ) {
      throw new NotFoundException({
        message: ['The practitioner could not be found.'],
      });
    }

    const event = await this.eventsService.createPractitionerEvent(
      user.id,
      createEventRequest,
    );

    return new PractitionerEventDto({
      id: event.id,
      title: event.title,
      createdAt: event.createdAt,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      hexColor: event.hexColor,
      isAllDay: event.isAllDay,
      isConfirmed: event.isConfirmed,
      location: event.location,
      practitionerId: event.practitionerId,
    });
  }

  @Patch('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard('firebase'))
  async updatePractitionerEvent(
    @Request() req,
    @Body() updateEventRequest: UpdatePractitionerEventRequest,
    @Param('id') eventId,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);
    const practitionerId = await this.eventsService.getPractitionerIdForEventId(
      eventId,
    );

    if (!practitionerId) {
      throw new NotFoundException({
        message: ['The event could not be found.'],
      });
    }

    const userPractitionersIds = await this.practitionersService.getPractitionersIdsForUserId(
      userId,
    );

    if (!userPractitionersIds.some(id => id == practitionerId)) {
      throw new ForbiddenException({
        message: [`You do not have access to the event.`],
      });
    }

    await this.eventsService.updatePractitionerEvent(
      eventId,
      updateEventRequest,
    );
  }

  @Delete('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard('firebase'))
  async deletePractitionerEvent(@Request() req, @Param('id') eventId) {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);
    const practitionerId = await this.eventsService.getPractitionerIdForEventId(
      eventId,
    );

    if (!practitionerId) {
      throw new NotFoundException({
        message: ['The event could not be found.'],
      });
    }

    const userPractitionersIds = await this.practitionersService.getPractitionersIdsForUserId(
      userId,
    );

    if (!userPractitionersIds.some(id => id == practitionerId)) {
      throw new ForbiddenException({
        message: [`You do not have access to the event.`],
      });
    }

    await this.eventsService.deletePractitionerEvent(eventId);
  }
}
