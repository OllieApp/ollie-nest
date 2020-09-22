import { PractitionersController } from './practitioners.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './entities/language.entity';
import { PractitionerCategory } from './entities/practitioner-category.entity';
import { PractitionerSchedule } from './entities/practitioner-schedule.entity';
import { Practitioner } from './entities/practitioner.entity';
import { UsersService } from 'src/users/users.service';
import { PractitionersService } from './services/practitioners.service';
import { PractitionerSchedulesService } from './services/practitioner-schedules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Practitioner,
      PractitionerCategory,
      PractitionerSchedule,
      Language,
    ]),
    UsersService,
  ],
  controllers: [PractitionersController],
  providers: [UsersService, PractitionersService, PractitionerSchedulesService],
  exports: [PractitionersService, PractitionerSchedulesService],
})
export class PractitionersModule {}
