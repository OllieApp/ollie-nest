import PractitionerEvent from 'src/practitioner_events/entities/practitioner_event.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PractitionerEventsService } from './practitioner_events.service';

@Module({
  imports: [TypeOrmModule.forFeature([PractitionerEvent])],
  controllers: [],
  providers: [PractitionerEventsService],
  exports: [PractitionerEventsService],
})
export class PractitionerEventsModule {}
