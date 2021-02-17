import { UsersModule } from './../users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import CovidTestingRequest from './entities/covid-testing-request.entity';
import ExtrasService from './services/extras.service';
import { ExtrasController } from './extras.controller';
import { EmailSenderModule } from 'src/integrations/email-sender/email-sender.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CovidTestingRequest]),
    UsersModule,
    EmailSenderModule,
  ],
  controllers: [ExtrasController],
  providers: [ExtrasService],
})
export class ExtrasModule {}
