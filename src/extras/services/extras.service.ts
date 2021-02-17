import { Logger } from '@nestjs/common/services/logger.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
      if (!this.credentials.client_email || !this.credentials.private_key) {
        throw new Error(
          'The credentials for the service account were not loaded',
        );
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
  ): Promise<CovidTestingRequest> {
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

    const preferredDate = DateTime.fromISO(date)
      .setZone('Africa/Johannesburg')
      .startOf('day');

    if (
      preferredDate <
      DateTime.utc()
        .setZone('Africa/Johannesburg')
        .startOf('day')
    ) {
      throw new BadRequestException({
        message: ['The selected date for the testing can not be in the past.'],
      });
    }

    const testingTypesTotal =
      testingTypesCount.pctCount +
      testingTypesCount.antibodyCount +
      testingTypesCount.antigenCount;

    if (numberOfPeople !== testingTypesTotal) {
      throw new BadRequestException({
        message: [
          'The sum of each type of Covid testing has to equal to the inputted number of people.',
        ],
      });
    }

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

    const formattedCreatedDate = DateTime.fromJSDate(
      covidTestingEntity.createdAt,
    )
      .setZone('Africa/Johannesburg')
      .toFormat('dd.MM.yyyy t');

    try {
      const sheet = doc.sheetsByIndex[0];
      await sheet.addRow([
        formattedCreatedDate,
        fullName,
        email,
        phoneNumber,
        fullAddress,
        numberOfPeople,
        preferredDate.toFormat('dd.MM.yyyy'),
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
    return covidTestingEntity;
  }
}

export default ExtrasService;
