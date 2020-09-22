import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MedicalAid from './entities/medical_aid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalAid])],
  controllers: [],
  providers: [],
  exports: [],
})
export class MedicalAidsModule {}
