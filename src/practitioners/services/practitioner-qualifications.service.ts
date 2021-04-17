import { Logger } from '@nestjs/common/services/logger.service';
import { DateTime } from 'luxon';
import { PractitionerQualificationDto } from './../dto/practitioner-qualification.dto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PractitionerQualification from '../entities/practitioner-qualification.entity';

@Injectable()
export class PractitionerQualificationsService {
  private readonly logger: Logger = new Logger(
    PractitionerQualificationsService.name,
  );
  constructor(
    @InjectRepository(PractitionerQualification)
    private readonly qualificationsRepository: Repository<
      PractitionerQualification
    >,
  ) {}

  async updateQualificationsByPractitionerId(
    practitionerId: string,
    qualifications: PractitionerQualificationDto[],
  ) {
    if (
      !practitionerId ||
      practitionerId.trim().length == 0 ||
      !qualifications
    ) {
      return;
    }

    // delete the old qualifications
    try {
      await this.qualificationsRepository.delete({ practitionerId });
    } catch (error) {
      this.logger.error(
        `Error occurred while trying to delete the old qualifications for the practitioner ${error}`,
      );
      throw new InternalServerErrorException({
        message: [
          "Something wrong went while trying to update the practitioner's qualifications.",
        ],
      });
    }

    // add the current qualifications
    try {
      const mappedQualifications = qualifications.map(q => {
        const fromDate = DateTime.fromISO(q.fromDate);
        const toDate = q.toDate ? DateTime.fromISO(q.toDate) : null;
        if (!q.isCurrent && toDate == null) {
          throw new Error(
            'The qualification is not current and is missing the toDate property.',
          );
        }
        return {
          fromDate,
          isCurrent: q.isCurrent,
          practitionerId: practitionerId,
          title: q.title,
          toDate: q.isCurrent ? null : toDate,
        };
      });
      await this.qualificationsRepository
        .createQueryBuilder()
        .insert()
        .into(PractitionerQualification)
        .values(mappedQualifications)
        .execute();
    } catch (error) {
      this.logger.error(
        `Error occurred while trying to insert the new qualifications for the practitioner with id ${practitionerId} \n ${error}`,
      );
      throw new InternalServerErrorException({
        message: [
          "Something wrong went while trying to update the practitioner's qualifications.",
        ],
      });
    }
  }

  async getQualificationsForPractitionerId(
    practitionerId: string,
  ): Promise<PractitionerQualification[]> {
    try {
      return await this.qualificationsRepository.find({
        where: [
          {
            practitionerId,
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Error occurred while trying to get the qualifications for the practitioner with id ${practitionerId} \n ${error}`,
      );
      throw new InternalServerErrorException({
        message: [
          "Something wrong went while trying to get the practitioner's qualifications.",
        ],
      });
    }
  }
}
