import { UsersModule } from './../users/users.module';
import { PractitionersController } from './practitioners.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './entities/language.entity';
import { PractitionerCategory } from './entities/practitioner-category.entity';
import PractitionerSchedule from './entities/practitioner-schedule.entity';
import Practitioner from './entities/practitioner.entity';
import { PractitionersService } from './services/practitioners.service';
import { PractitionerSchedulesService } from './services/practitioner-schedules.service';
import { PractitionerQualificationsService } from './services/practitioner-qualifications.service';
import PractitionerQualification from './entities/practitioner-qualification.entity';
import Address from 'src/shared/entities/address.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Address,
      Practitioner,
      PractitionerCategory,
      PractitionerSchedule,
      Language,
      PractitionerQualification,
    ]),
  ],
  controllers: [PractitionersController],
  providers: [
    PractitionersService,
    PractitionerSchedulesService,
    PractitionerQualificationsService,
  ],
  exports: [PractitionersService, PractitionerSchedulesService],
})
export class PractitionersModule {}
