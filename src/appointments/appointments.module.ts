import { AppointmentsService } from './appointments.service';
import { PractitionersModule } from './../practitioners/practitioners.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppointmentStatus from './entities/appointment-status.entity';
import Appointment from './entities/appointment.entity';
import { UsersModule } from './../users/users.module';
import { WherebyMeetingsModule } from 'src/integrations/whereby-meetings/whereby-meetings.module';
import { AppointmentsController } from './appointments.controller';
import { EmailSenderModule } from 'src/integrations/email-sender/email-sender.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentStatus, Appointment]),
    UsersModule,
    PractitionersModule,
    WherebyMeetingsModule,
    EmailSenderModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
