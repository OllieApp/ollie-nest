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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentDto } from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';
import { PractitionersService } from 'src/practitioners/services/practitioners.service';
import { UsersService } from '../users/users.service';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { CancelAppointmentRequest } from './requests/cancel-appointment.request';
import { PRACTITIONER_CATEGORY } from 'src/practitioners/dto/category.dto';

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
      await this.emailService.sendPracitionerVideoAppointmentDetails(
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
  async cancelAppointment(
    @Request() req,
    @Body() cancelAppointmentRequest: CancelAppointmentRequest,
    @Param('id') appointmentId: string,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    const appointment = await this.appointmentsService.getAppointmentById(
      appointmentId,
    );
    if (!appointment) {
      throw new NotFoundException({
        message: 'The appointment could not be found in the appointment store.',
      });
    }
    const practitionerIds = await this.practitionersService.getPractitionersIdsForUserId(
      userId,
    );
    const isDoctorCancelling = practitionerIds.some(
      id => id === appointment.practitionerId,
    );
    if (!isDoctorCancelling && appointment.userId != userId) {
      // if the user is not the practitioner nor the patient, we send a not found
      // as the user doesn't have access to the appointment
      throw new NotFoundException({
        message: 'The appointment could not be found in the appointment store.',
      });
    }
    await this.appointmentsService.cancelAppointment(
      appointmentId,
      userId,
      isDoctorCancelling,
      cancelAppointmentRequest.cancellationReason,
    );

    const practitioner = await this.practitionersService.getPractitionerById(
      appointment.practitionerId,
    );
    const user = await this.usersService.getUserById(appointment.userId);
    if (isDoctorCancelling) {
      this.emailService.sendUserAppointmentCancelledByPractitioner(user.email, {
        appointmentStartTime: appointment.startTime,
        practitionerTitle: practitioner.title,
        userFirstName: user.firstName,
      });
    } else {
      // TODO: send the email to all users who have access to this practitioner when we allow multiple users per practitioner
      this.emailService.sendPractitionerAppointmentCancelledByUser(
        practitioner.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          userFirstName: user.firstName,
          userLastName: user.lastName,
        },
      );
    }
  }
}
