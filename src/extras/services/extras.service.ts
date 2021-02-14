import { Logger } from '@nestjs/common/services/logger.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GoogleSpreadsheet,
  ServiceAccountCredentials,
} from 'google-spreadsheet';
import { Repository } from 'typeorm';
import CovidTestingRequest from '../entities/covid-testing-request.entity';
import { CovidTestingNextPathologyRequest } from '../requests/covid-testing.request';
import * as fs from 'fs';
import { DateTime } from 'luxon';

@Injectable()
class ExtrasService {
  private credentials: ServiceAccountCredentials | null | undefined;
  private readonly logger: Logger;
  constructor(
    @InjectRepository(CovidTestingRequest)
    private readonly covidTestingRepo: Repository<CovidTestingRequest>,
  ) {
    this.logger = new Logger(ExtrasService.name);
  }

  private loadCredentialsForServiceAccount() {
    try {
      const buffer = fs.readFileSync(
        process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH,
      );
      this.credentials = JSON.parse(buffer.toString());
      if (!!this.credentials.client_email || !!this.credentials.private_key) {
        throw new Error();
      }
    } catch (error) {
      this.logger.error(
        `Couldn't load the credentials for the service account ${error}`,
      );
      throw new InternalServerErrorException({
        message: ['Something went wrong while trying to process your request.'],
      });
    }
  }

  async requestCovidTestingWithNextPath(
    userId: string,
    request: CovidTestingNextPathologyRequest,
  ): Promise<void> {
    const {
      date,
      email,
      fullAddress,
      fullName,
      numberOfPeople,
      phoneNumber,
      testingTypesCount,
      notes,
    } = request;

    const preferredDate = DateTime.fromISO(date, {
      zone: 'Africa/Johannesburg',
    }).startOf('day');

    // save the data into the database
    let covidTestingEntity = new CovidTestingRequest();
    covidTestingEntity.fullName = fullName;
    covidTestingEntity.email = email;
    covidTestingEntity.phone = phoneNumber;
    covidTestingEntity.fullAddress = fullAddress;
    covidTestingEntity.numberOfPeople = numberOfPeople;
    covidTestingEntity.testingTypesCount = {
      pctTestingCount: testingTypesCount.pctCount,
      antigenTestingCount: testingTypesCount.antigenCount,
      antibodyTestingCount: testingTypesCount.antibodyCount,
    };
    covidTestingEntity.userId = userId;
    covidTestingEntity.date = preferredDate.toUTC().toJSDate();
    covidTestingEntity.notes = notes;

    try {
      covidTestingEntity = await this.covidTestingRepo.save(covidTestingEntity);
    } catch (error) {
      this.logger.error(
        `Error while trying to persist the data into the database ${error}`,
      );
      throw new InternalServerErrorException({
        message: ['Something went wrong while trying to process your request.'],
      });
    }

    // insert the data into the Google sheet
    if (!this.credentials) {
      this.loadCredentialsForServiceAccount();
    }
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SPREADSHEET_COVID_NEXT_PATH_ID,
    );

    try {
      await doc.useServiceAccountAuth(this.credentials);
      await doc.loadInfo();
    } catch (error) {
      this.logger.error(
        `Error while trying to access the file with the provided credentials ${error}`,
      );
      throw new InternalServerErrorException({
        message: ['Something went wrong while trying to process your request.'],
      });
    }

    try {
      const sheet = doc.sheetsByIndex[0];
      await sheet.addRow([
        covidTestingEntity.createdAt.toISOString(),
        fullName,
        email,
        phoneNumber,
        fullAddress,
        numberOfPeople,
        preferredDate.toFormat('dd.MM.YYYY'),
        testingTypesCount.pctCount,
        testingTypesCount.antigenCount,
        testingTypesCount.antibodyCount,
        notes ?? '',
      ]);
    } catch (error) {
      this.logger.error(
        `Error while trying to insert the data into the spreadsheet ${error}`,
      );
      throw new InternalServerErrorException({
        message: ['Something went wrong while trying to process your request.'],
      });
    }
  }
}

export default ExtrasService;
