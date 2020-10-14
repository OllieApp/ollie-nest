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
import { UsersService } from 'src/users/users.service';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { CancelAppointmentRequest } from './requests/cancel-appointment.request';

@Controller('/appointments')
export class AppointmentsController {
  constructor(
    private readonly practitionersService: PractitionersService,
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('firebase'))
  async createAppointment(
    @Request() req,
    @Body() createAppointmentRequest: CreateAppointmentRequest,
  ): Promise<AppointmentDto> {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);
    const appointmentTimeSlot = (
      await this.practitionersService.getPractitionerById(
        createAppointmentRequest.practitionerId,
      )
    ).appointmentTimeSlot;
    const appointment = await this.appointmentsService.createAppointment(
      userId,
      createAppointmentRequest,
      appointmentTimeSlot,
    );
    return new AppointmentDto({ ...appointment, status: appointment.statusId });
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
  }
}
