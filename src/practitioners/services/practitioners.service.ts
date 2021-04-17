import { LANGUAGE } from '../dto/language.dto';
import { PRACTITIONER_CATEGORY } from '../dto/category.dto';
import { MEDICAL_AID } from './../../medical_aids/models/medical_aid.model';
import { UpdatePractitionerRequest } from '../requests/update-practitioner.request';
import { CreatePractitionerRequest } from '../requests/create-practitioner.request';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import Practitioner from '../entities/practitioner.entity';
import { emailValidationPattern } from 'src/constants';
import { FIREBASE_STORAGE_PRACTITIONERS_AVATARS_BUCKET } from '../constants';
import {
  FIREBASE_ADMIN_INJECT,
  FirebaseAdminSDK,
} from '@tfarras/nestjs-firebase-admin';
import * as crypto from 'crypto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

@Injectable()
export class PractitionersService {
  constructor(
    @InjectRepository(Practitioner)
    private readonly practitionerRepository: Repository<Practitioner>,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) {}

  async createPractitioner(
    userId: string,
    userUid: string,
    request: CreatePractitionerRequest,
  ): Promise<Practitioner> {
    const { firstName, lastName, category, email, gender } = request;
    const title = `Dr. ${firstName} ${lastName}`;

    if (!firstName || firstName.trim().length == 0) {
      throw new BadRequestException({
        message: ['The first name of the practitioner cannot be empty.'],
      });
    }
    if (!lastName || lastName.trim().length == 0) {
      throw new BadRequestException({
        message: ['The last name of the practitioner cannot be empty.'],
      });
    }

    if (!emailValidationPattern.test(email)) {
      throw new BadRequestException({
        message: ['The email for the practitioner is invalid.'],
      });
    }

    const userCustomClaims = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'practitioner',
        'x-hasura-allowed-roles': ['user', 'practitioner'],
        'x-hasura-user-id': userUid,
      },
    };

    // set Hasura custom claims for access to graphQL based on role
    await this.firebaseAdmin
      .auth()
      .setCustomUserClaims(userUid, userCustomClaims);

    try {
      const newPractitioner = this.practitionerRepository.create({
        email,
        gender,
        createdById: userId,
        title,
        category: {
          id: category,
        },
        languages: [{ id: LANGUAGE.English }],
      });

      return await this.practitionerRepository.save(newPractitioner);
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to create the practitioner',
        ],
      });
    }
  }

  async getPractitionersIdsForUserId(userId: string): Promise<Array<string>> {
    try {
      return (
        (
          await this.practitionerRepository.find({
            where: { createdById: userId },
          })
        )?.map(p => p.id) ?? []
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to fetch the ids for the practitioners.',
        ],
      });
    }
  }

  async getPractitionerByUserId(
    practitionerId: string,
    userId: string,
  ): Promise<Practitioner | null> {
    try {
      return (
        (await this.practitionerRepository.findOne({
          where: { createdById: userId, id: practitionerId },
        })) ?? null
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to fetch the practitioner.',
        ],
      });
    }
  }

  async getPractitionerById(practitionerId: string): Promise<Practitioner> {
    let practitioner: Practitioner | null | undefined;
    try {
      practitioner = await this.practitionerRepository.findOne(practitionerId);
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to fetch the practitioner.',
        ],
      });
    }
    if (!practitioner) {
      throw new NotFoundException({
        message: ['The practitioner could not be found'],
      });
    }
    return practitioner;
  }

  async updatePractitioner(
    practitionerId: string,
    request: UpdatePractitionerRequest,
  ) {
    if (request.title && request.title.trim().length == 0) {
      throw new BadRequestException({
        message: ['The title of the practitioner cannot be empty.'],
      });
    }
    if (request.email && !emailValidationPattern.test(request.email)) {
      throw new BadRequestException({
        message: ['The email of the practitioner is invalid.'],
      });
    }
    if (
      request.consultationPricingFrom &&
      request.consultationPricingFrom < 0
    ) {
      throw new BadRequestException({
        message: [
          'The starting price of a consultation has to be a positive decimal number.',
        ],
      });
    }
    if (request.consultationPricingTo && request.consultationPricingTo < 0) {
      throw new BadRequestException({
        message: [
          'The highest price of a consultation has to be a positive decimal number.',
        ],
      });
    }

    if (
      request.medicalAids &&
      request.medicalAids.some(m => !(m in MEDICAL_AID))
    ) {
      throw new BadRequestException({
        message: [
          'One of the medical aids could not be find in the available medical aids.',
        ],
      });
    }

    if (request.category && !(request.category in PRACTITIONER_CATEGORY)) {
      throw new BadRequestException({
        message: [
          'The category could not be found in the available practitioner categories.',
        ],
      });
    }

    if (
      request.location &&
      (request.location.latitude > 90 ||
        request.location.latitude < -90 ||
        request.location.longitude > 180 ||
        request.location.longitude < -180)
    ) {
      throw new BadRequestException({
        message: ["The location is not within Earth's location bounds."],
      });
    }

    if (request.languages && request.languages.some(l => !(l in LANGUAGE))) {
      throw new BadRequestException({
        message: [
          'One of the languages is not part of our available languages.',
        ],
      });
    }

    try {
      const removeEmpty = (obj: any) => {
        Object.keys(obj).forEach(key => obj[key] == null && delete obj[key]);
      };
      const updatedPractitioner: QueryDeepPartialEntity<Practitioner> = {
        ...request,
        medicalAids: request.medicalAids
          ? request.medicalAids.map(m => ({ id: m }))
          : null,
        category: request.category
          ? {
              id: request.category,
            }
          : null,
        location: request.location
          ? {
              type: 'Point',
              coordinates: [
                request.location.latitude,
                request.location.longitude,
              ],
            }
          : null,
        languages: request.languages
          ? request.languages.map(l => ({ id: l }))
          : null,
        // we don't update qualifications here
        qualifications: undefined,
      };

      removeEmpty(updatedPractitioner);

      this.practitionerRepository.update(practitionerId, updatedPractitioner);
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to update the practitioner.',
        ],
      });
    }
  }

  async updateAvatar(
    dataBuffer: any,
    practitionerId: string,
    fileType: any,
  ): Promise<string> {
    const practitioner = await this.practitionerRepository.findOne(
      practitionerId,
    );
    if (!practitioner) {
      throw new NotFoundException({
        message: ['The practitioner could not be found.'],
      });
    }

    const md5UserUid = crypto
      .createHash('md5')
      .update(practitionerId)
      .digest('hex');
    const folder = 'avatars';
    const fileName = `${folder}/${md5UserUid}`;

    const bucket = this.firebaseAdmin
      .storage()
      .bucket(FIREBASE_STORAGE_PRACTITIONERS_AVATARS_BUCKET);

    //TODO: Check file size requirements at some later point

    try {
      await bucket.deleteFiles({ prefix: fileName, force: true });
    } catch (error) {
      //Log this at a later point
    }

    const file = bucket.file(`${fileName}_${Date.now()}`);
    await file.save(dataBuffer.buffer, {
      gzip: true,
      contentType: fileType,
      public: true,
    });

    const url = (
      await file.getSignedUrl({
        expires: new Date(2999, 12, 31),
        action: 'read',
      })
    )[0].split('?')[0];

    await this.practitionerRepository.update(
      { id: practitionerId },
      {
        avatarUrl: url,
      },
    );

    return url;
  }

  async deleteAvatar(practitionerId: string) {
    const md5UserUid = crypto
      .createHash('md5')
      .update(practitionerId)
      .digest('hex');
    const folder = 'avatars';
    const fileName = `${folder}/${md5UserUid}`;

    const bucket = this.firebaseAdmin
      .storage()
      .bucket(FIREBASE_STORAGE_PRACTITIONERS_AVATARS_BUCKET);

    //TODO: Check file size requirements at some later point

    try {
      await bucket.deleteFiles({ prefix: fileName, force: true });
    } catch (error) {
      //Log this at a later point
    }

    await this.practitionerRepository.update(
      { id: practitionerId },
      {
        avatarUrl: null,
      },
    );
  }
}
