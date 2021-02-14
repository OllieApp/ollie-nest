import { UsersModule } from './../users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import CovidTestingRequest from './entities/covid-testing-request.entity';
import ExtrasService from './services/extras.service';
import { ExtrasController } from './extras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CovidTestingRequest]), UsersModule],
  controllers: [ExtrasController],
  providers: [ExtrasService],
})
export class ExtrasModule {}
