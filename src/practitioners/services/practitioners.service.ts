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
import { Practitioner } from '../entities/practitioner.entity';
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
  userRepository: any;
  constructor(
    @InjectRepository(Practitioner)
    private readonly practitionerRepository: Repository<Practitioner>,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) {}

  async createPractitioner(
    userId: string,
    createPractitionerDto: CreatePractitionerRequest,
  ): Promise<Practitioner> {
    const { title, category, email, gender } = createPractitionerDto;

    if (title.trim().length == 0) {
      throw new BadRequestException({
        message: 'The title for the practitioner cannot be empty.',
      });
    }
    if (!emailValidationPattern.test(email)) {
      throw new BadRequestException({
        message: 'The email for the practitioner is invalid.',
      });
    }

    try {
      const newPractitioner = this.practitionerRepository.create({
        email,
        gender,
        createdById: userId,
        title,
        category: {
          id: category,
        },
      });

      return await this.practitionerRepository.save(newPractitioner);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to create the practitioner',
      });
    }
  }

  async getPractitionersIdsForUserId(userId: string): Promise<Array<string>> {
    try {
      return (
        (
          await this.practitionerRepository.find({
            select: ['id'],
            where: { createdById: userId },
          })
        )?.map(p => p.id) ?? []
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message:
          'Something went wrong while trying to fetch the ids for the practitioners.',
      });
    }
  }

  async getPractitionerForUserId(
    practitionerId: string,
    userId: string,
  ): Promise<Practitioner | null> {
    try {
      return (
        (await this.practitionerRepository.findOne({
          where: { createdBy: userId, id: practitionerId },
        })) ?? null
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to fetch the practitioner.',
      });
    }
  }

  async updatePractitioner(
    practitionerId: string,
    data: UpdatePractitionerRequest,
  ) {
    if (data.title && data.title.trim().length == 0) {
      throw new BadRequestException({
        message: 'The title of the practitioner cannot be empty.',
      });
    }
    if (data.email && !emailValidationPattern.test(data.email)) {
      throw new BadRequestException({
        message: 'The email of the practitioner is invalid.',
      });
    }
    if (
      data.consultationPricingRange &&
      (data.consultationPricingRange < 0 ||
        data.consultationPricingRange % 100 != 0)
    ) {
      throw new BadRequestException({
        message:
          'The consultation pricing range has to be a positive number divisible with 100.',
      });
    }

    if (data.medicalAids && data.medicalAids.some(m => !(m in MEDICAL_AID))) {
      throw new BadRequestException({
        message:
          'One of the medical aids could not be find in the available medical aids.',
      });
    }

    if (data.category && !(data.category in PRACTITIONER_CATEGORY)) {
      throw new BadRequestException({
        message:
          'The category could not be found in the available practitioner categories.',
      });
    }

    if (
      data.location &&
      (data.location.latitude > 90 ||
        data.location.latitude < -90 ||
        data.location.longitude > 180 ||
        data.location.longitude < -180)
    ) {
      throw new BadRequestException({
        message: "The location is not within Earth's location bounds.",
      });
    }

    if (data.languages && data.languages.some(l => !(l in LANGUAGE))) {
      throw new BadRequestException({
        message: 'One of the languages is not part of our available languages.',
      });
    }

    try {
      const removeEmpty = (obj: any) => {
        Object.keys(obj).forEach(key => obj[key] == null && delete obj[key]);
      };
      const updatedPractitioner: QueryDeepPartialEntity<Practitioner> = {
        ...data,
        medicalAids: data.medicalAids
          ? data.medicalAids.map(m => ({ id: m }))
          : null,
        category: data.category
          ? {
              id: data.category,
            }
          : null,
        location: data.location
          ? {
              type: 'Point',
              coordinates: [data.location.latitude, data.location.longitude],
            }
          : null,
        languages: data.languages ? data.languages.map(l => ({ id: l })) : null,
      };

      removeEmpty(updatedPractitioner);

      this.practitionerRepository.update(practitionerId, updatedPractitioner);
    } catch (error) {
      throw new InternalServerErrorException({
        message:
          'Something went wrong while trying to update the practitioner.',
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
        message: 'The practitioner could not be found.',
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
