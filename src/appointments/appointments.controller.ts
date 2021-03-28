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
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentDto } from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';
import { PractitionersService } from 'src/practitioners/services/practitioners.service';
import { UsersService } from '../users/users.service';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { CancelAppointmentRequest } from './requests/cancel-appointment.request';
import {
  GoogleSpreadsheet,
  ServiceAccountCredentials,
} from 'google-spreadsheet';
import * as fs from 'fs';
import { DateTime } from 'luxon';

@Controller('/appointments')
export class AppointmentsController {
  private readonly logger: Logger;
  private credentials: ServiceAccountCredentials | null | undefined;
  constructor(
    private readonly practitionersService: PractitionersService,
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly emailService: EmailSenderService,
  ) {}

  private loadCredentialsForServiceAccount() {
    try {
      const buffer = fs.readFileSync(
        process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH,
      );
      this.credentials = JSON.parse(buffer.toString());
      if (!this.credentials.client_email || !this.credentials.private_key) {
        throw new Error(
          'The credentials for the service account were not loaded',
        );
      }
    } catch (error) {
      throw new InternalServerErrorException({
        message: ['Something went wrong while trying to process your request.'],
      });
    }
  }

  @Post()
  @UseGuards(AuthGuard('firebase'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAppointment(
    @Request() req,
    @Body() createAppointmentRequest: CreateAppointmentRequest,
  ): Promise<AppointmentDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    const practitioner = await this.practitionersService.getPractitionerById(
      createAppointmentRequest.practitionerId,
    );

    if (!practitioner.isActive) {
      throw new BadRequestException({
        message: [
          'The practitioner you are trying to book is not receiving new appointments.',
        ],
      });
    }

    const appointmentTimeSlot = practitioner.appointmentTimeSlot;
    const appointment = await this.appointmentsService.createAppointment(
      user.id,
      createAppointmentRequest,
      appointmentTimeSlot,
    );

    this.emailService.sendPractitionerAppointmentReceived(practitioner.email, {
      appointmentStartTime: appointment.startTime,
      isVirtual: appointment.isVirtual,
      practitionerTitle: practitioner.title,
      userNotes: appointment.userNotes,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userAvatarUrl: user.avatarUrl,
    });

    // TODO: if we ever add logic for appointments that are not automatically confirmed,
    // do not send the user email only when the appointment is confirmed
    this.emailService.sendUserAppointmentConfirmed(user.email, {
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
      this.emailService.sendPractitionerVideoAppointmentDetails(
        practitioner.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          practitionerVideoUrl: appointment.doctorVideoUrl,
          userFirstName: user.firstName,
          userLastName: user.lastName,
        },
      );
      this.emailService.sendUserVideoAppointmentDetails(user.email, {
        appointmentStartTime: appointment.startTime,
        practitionerTitle: practitioner.title,
        practitionerVideoUrl: appointment.userVideoUrl,
        userFirstName: user.firstName,
      });
    }
    this.emailService.sendInternalAppointmentCreated({
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

    this.addAppointmentToGoogleSheet(
      practitioner.title,
      user.firstName,
      user.lastName,
      { ...appointment, status: appointment.statusId },
    );

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
      this.emailService.sendUserAppointmentCancelledByPractitioner(user.email, {
        appointmentStartTime: appointment.startTime,
        practitionerTitle: practitioner.title,
        userFirstName: user.firstName,
      });
      // TODO: send the email to all users who have access to this practitioner when we allow multiple users per practitioner
      this.emailService.sendPractitionerAppointmentCancelledConfirmation(
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
      this.emailService.sendPractitionerAppointmentCancelledByUser(
        practitioner.email,
        {
          appointmentStartTime: appointment.startTime,
          practitionerTitle: practitioner.title,
          userFirstName: user.firstName,
          userLastName: user.lastName,
        },
      );
      this.emailService.sendUserAppointmentCancelledConfirmation(user.email, {
        practitionerTitle: practitioner.title,
        practitionerEmail: practitioner.email,
        userFirstName: user.firstName,
        practitionerPhone: practitioner.phone,
      });
    }
  }

  private async addAppointmentToGoogleSheet(
    practitionerTitle: string,
    patientFirstName: string,
    patientLastName: string,
    appointment: AppointmentDto,
  ) {
    // insert the data into the Google sheet
    if (!this.credentials) {
      this.loadCredentialsForServiceAccount();
    }
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SPREADSHEET_NEW_APPOINTMENTS_ID,
    );

    try {
      await doc.useServiceAccountAuth(this.credentials);
      await doc.loadInfo();
    } catch (error) {
      this.logger.error(
        `Error while trying to access the file with the provided credentials ${error}`,
      );
      return;
    }

    const formattedStartTime = DateTime.fromJSDate(appointment.startTime)
      .setZone('Africa/Johannesburg')
      .toFormat('dd.MM.yyyy t');
    const formattedEndTime = DateTime.fromJSDate(appointment.endTime)
      .setZone('Africa/Johannesburg')
      .toFormat('dd.MM.yyyy t');

    const formattedCreatedDate = DateTime.fromJSDate(appointment.createdAt)
      .setZone('Africa/Johannesburg')
      .toFormat('dd.MM.yyyy t');

    try {
      const sheet = doc.sheetsByIndex[0];
      await sheet.addRow([
        appointment.id,
        practitionerTitle,
        patientFirstName,
        patientLastName,
        appointment.isVirtual ? 'Virtual' : 'Physical',
        formattedStartTime,
        formattedEndTime,
        appointment.userNotes,
        formattedCreatedDate,
      ]);
    } catch (error) {
      this.logger.error(
        `Error while trying to insert the appointment data into the spreadsheet ${error}`,
      );
    }
  }
}
