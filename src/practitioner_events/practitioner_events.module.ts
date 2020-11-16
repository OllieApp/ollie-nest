import { PractitionersModule } from './../practitioners/practitioners.module';
import { UsersModule } from './../users/users.module';
import PractitionerEvent from 'src/practitioner_events/entities/practitioner_event.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PractitionerEventsService } from './practitioner_events.service';
import { PractitionerEventsController } from './practitioner_events.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PractitionerEvent]),
    UsersModule,
    PractitionersModule,
  ],
  controllers: [PractitionerEventsController],
  providers: [PractitionerEventsService],
  exports: [PractitionerEventsService],
})
export class PractitionerEventsModule {}
