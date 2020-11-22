import { EmailSenderService } from '../integrations/email-sender/email-sender.service';
import { CreateAppointmentRequest } from './requests/create-appointment.request';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentDto } from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';
import { PractitionersService } from 'src/practitioners/services/practitioners.service';
import { UsersService } from '../users/users.service';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { CancelAppointmentRequest } from './requests/cancel-appointment.request';
import { PRACTITIONER_CATEGORY } from 'src/practitioners/dto/category.dto';
import { use } from 'passport';

@Controller('/appointments')
export class AppointmentsController {
  constructor(
    private readonly practitionersService: PractitionersService,
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly emailService: EmailSenderService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('firebase'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAppointment(
    @Request() req,
    @Body() createAppointmentRequest: CreateAppointmentRequest,
  ): Promise<AppointmentDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    const appointmentTimeSlot = (
      await this.practitionersService.getPractitionerById(
        createAppointmentRequest.practitionerId,
      )
    ).appointmentTimeSlot;
    const appointment = await this.appointmentsService.createAppointment(
      user.id,
      createAppointmentRequest,
      appointmentTimeSlot,
    );
    const practitioner = await this.practitionersService.getPractitionerById(
      createAppointmentRequest.practitionerId,
    );

    await this.emailService.sendPractitionerAppointmentReceived(
      practitioner.email,
      {
        appointmentStartTime: appointment.startTime,
        isVirtual: appointment.isVirtual,
        practitionerTitle: practitioner.title,
        userNotes: appointment.userNotes,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userAvatarUrl: user.avatarUrl,
      },
    );

    // TODO: if we ever add logic for appointments that are not automatically confirmed,
    // do not send the user email only when the appointment is confirmed
    await this.emailService.sendUserAppointmentConfirmed(user.email, {
      appointmentStartTime: appointment.startTime,
      isVirtual: appointment.isVirtual,
      practitionerTitle: practitioner.title,
      userNotes: appointment.userNotes,
      userFirstName: user.firstName,
      practitionerAddress: practitioner.address,
      practitionerAvatarUrl: practitioner.avatarUrl,
      practitionerCategory: practitioner.category.id,
    });

    if (
      appointment.isVirtual &&
      appointment.userVideoUrl &&
      appointment.doctorVideoUrl
    ) {
      await this.emailService.sendPractitionerVideoAppointmentDetails(
        practitioner.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          practitionerVideoUrl: appointment.doctorVideoUrl,
          userFirstName: user.firstName,
          userLastName: user.lastName,
        },
      );
      await this.emailService.sendUserVideoAppointmentDetails(user.email, {
        appointmentStartTime: appointment.startTime,
        practitionerTitle: practitioner.title,
        practitionerVideoUrl: appointment.userVideoUrl,
        userFirstName: user.firstName,
      });
    }
    await this.emailService.sendInternalAppointmentCreated({
      appointmentStartTime: appointment.startTime,
      appointmentIsVirtual: appointment.isVirtual,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userPhone: user.phone,
      practitionerTitle: practitioner.title,
      practitionerEmail: practitioner.email,
      practitionerPhone: practitioner.phone,
    });

    return new AppointmentDto({
      id: appointment.id,
      practitionerId: appointment.practitionerId,
      reviewId: appointment.reviewId,
      userId: appointment.userId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      isVirtual: appointment.isVirtual,
      createdAt: appointment.createdAt,
      userNotes: appointment.userNotes,
      videoUrl: appointment.userVideoUrl,
      status: appointment.statusId,
    });
  }

  @Post('/:id/cancel')
  @UseGuards(AuthGuard('firebase'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async cancelAppointment(
    @Request() req,
    @Body() cancelAppointmentRequest: CancelAppointmentRequest,
    @Param('id') appointmentId: string,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);

    const appointment = await this.appointmentsService.getAppointmentById(
      appointmentId,
    );
    if (!appointment) {
      throw new NotFoundException({
        message: [
          'The appointment could not be found in the appointment store.',
        ],
      });
    }
    const practitionerIds = await this.practitionersService.getPractitionersIdsForUserId(
      user.id,
    );
    const isPractitionerCancelling = practitionerIds.some(
      id => id === appointment.practitionerId,
    );
    if (!isPractitionerCancelling && appointment.userId != user.id) {
      // if the user is not the practitioner nor the patient, we send a not found
      // as the user doesn't have access to the appointment
      throw new NotFoundException({
        message: [
          'The appointment could not be found in the appointment store.',
        ],
      });
    }
    await this.appointmentsService.cancelAppointment(
      appointmentId,
      user.id,
      isPractitionerCancelling,
      cancelAppointmentRequest.cancellationReason,
    );

    const practitioner = await this.practitionersService.getPractitionerById(
      appointment.practitionerId,
    );
    if (isPractitionerCancelling) {
      await this.emailService.sendUserAppointmentCancelledByPractitioner(
        user.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          userFirstName: user.firstName,
        },
      );
      // TODO: send the email to all users who have access to this practitioner when we allow multiple users per practitioner
      await this.emailService.sendPractitionerAppointmentCancelledConfirmation(
        practitioner.email,
        {
          practitionerTitle: practitioner.title,
          userEmail: user.email,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userPhone: user.phone,
        },
      );
    } else {
      // TODO: send the email to all users who have access to this practitioner when we allow multiple users per practitioner
      await this.emailService.sendPractitionerAppointmentCancelledByUser(
        practitioner.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          userFirstName: user.firstName,
          userLastName: user.lastName,
        },
      );
      await this.emailService.sendUserAppointmentCancelledConfirmation(
        user.email,
        {
          practitionerTitle: practitioner.title,
          practitionerEmail: practitioner.email,
          userFirstName: user.firstName,
          practitionerPhone: practitioner.phone,
        },
      );
    }
  }
}
