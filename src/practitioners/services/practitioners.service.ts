import { LANGUAGE } from '../dto/language.dto';
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
import Address from 'src/shared/entities/address.entity';
import { COUNTRY_CODE } from 'src/shared/models/country-code.model';

@Injectable()
export class PractitionersService {
  constructor(
    @InjectRepository(Practitioner)
    private readonly practitionerRepository: Repository<Practitioner>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
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
    let address: null | Address = null;

    try {
      address = this.addressRepository.create({
        line1: '',
        line2: '',
        suburb: '',
        city: '',
        postalCode: '',
        countryCode: COUNTRY_CODE.SouthAfrica,
        location: null,
        stateProvinceCounty: '',
      });
      await this.addressRepository.save(address);
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to create the practitioner',
        ],
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
        languages: [{ id: LANGUAGE.English }],
        addressId: address?.id,
      });

      return {
        ...(await this.practitionerRepository.save(newPractitioner)),
        addressObject: address,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to create the practitioner',
        ],
      });
    }
  }

  async getPractitionersIdsForUserId(
    userId: string,
    isPowerUser: boolean = false,
  ): Promise<Array<string>> {
    try {
      let ids: Array<{
        id: string;
      }> = [];

      ids = await this.practitionerRepository
        .createQueryBuilder('practitioner')
        .select(['practitioner.id'])
        .where('practitioner.created_by = :userId OR TRUE = :isPowerUser ', {
          userId: userId,
          isPowerUser: isPowerUser,
        })
        .getRawMany();

      return ids.map(p => p.id);
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
    const {
      address,
      consultationPricingFrom,
      consultationPricingTo,
      email,
      languages,
      medicalAids,
      title,
      bio,
      isActive,
      phone,
    } = request;

    if (title && title.trim().length == 0) {
      throw new BadRequestException({
        message: ['The title of the practitioner cannot be empty.'],
      });
    }
    if (email && !emailValidationPattern.test(email.trim())) {
      throw new BadRequestException({
        message: ['The email of the practitioner is invalid.'],
      });
    }
    if (consultationPricingFrom && consultationPricingFrom < 0) {
      throw new BadRequestException({
        message: [
          'The starting price of a consultation has to be a positive decimal number.',
        ],
      });
    }
    if (consultationPricingTo && consultationPricingTo < 0) {
      throw new BadRequestException({
        message: [
          'The highest price of a consultation has to be a positive decimal number.',
        ],
      });
    }

    if (medicalAids && medicalAids.some(m => !(m in MEDICAL_AID))) {
      throw new BadRequestException({
        message: [
          'One of the medical aids could not be find in the available medical aids.',
        ],
      });
    }

    if (
      address &&
      address.location &&
      (address.location.latitude > 90 ||
        address.location.latitude < -90 ||
        address.location.longitude > 180 ||
        address.location.longitude < -180)
    ) {
      throw new BadRequestException({
        message: ["The location is not within Earth's location bounds."],
      });
    }

    if (languages && languages.some(l => !(l in LANGUAGE))) {
      throw new BadRequestException({
        message: [
          'One of the languages is not part of our available languages.',
        ],
      });
    }

    // we need to remove undefined for the update method because of
    // https://github.com/typeorm/typeorm/issues/2331
    // undefined in TS typeorm represents NULL in PostgreSQL for typeorm update method
    // (not for the save method though, where undefined is undefined and null is NULL in the db)

    const removeUndefined = (obj: any) => {
      Object.keys(obj).forEach(
        key => obj[key] === undefined && delete obj[key],
      );
    };

    const anyValuesToUpdate = (obj: any) =>
      Object.keys(obj).some(key => obj[key] !== undefined);

    try {
      const updatedDataPractitioner: QueryDeepPartialEntity<Practitioner> = {
        medicalAids: medicalAids?.map(m => ({ id: m })) ?? undefined,
        languages: languages?.map(l => ({ id: l })) ?? undefined,
        consultationPricingFrom: consultationPricingFrom ?? undefined,
        consultationPricingTo: consultationPricingTo ?? undefined,
        title: title?.trim() ?? undefined,
        email: email?.trim() ?? undefined,
        phone: phone?.trim() ?? undefined,
        isActive: isActive ?? undefined,
        bio: bio?.trim() ?? undefined,
      };

      removeUndefined(updatedDataPractitioner);

      if (anyValuesToUpdate(updatedDataPractitioner)) {
        await this.practitionerRepository.update(
          practitionerId,
          updatedDataPractitioner,
        );
      }

      if (address) {
        const addressId = await this.getAddressIdForPractitionerId(
          practitionerId,
        );
        const updatedAddressData: QueryDeepPartialEntity<Address> = {
          city: address.city?.trim() ?? undefined,
          line1: address.line1?.trim() ?? undefined,
          line2: address.line2?.trim() ?? undefined,
          // we don't allow a different country atm
          //countryCode: Object.values(COUNTRY_CODE).find(e => e == updatedAddress.countryCode),
          postalCode: address.postalCode?.trim() ?? undefined,
          stateProvinceCounty: address.stateProvinceCounty?.trim() ?? undefined,
          suburb: address.suburb?.trim() ?? undefined,
          location:
            address.location !== undefined
              ? address.location !== null
                ? {
                    type: 'Point',
                    coordinates: [
                      address.location.latitude,
                      address.location.longitude,
                    ],
                  }
                : null
              : undefined,
        };

        removeUndefined(updatedAddressData);

        if (anyValuesToUpdate(updatedAddressData)) {
          await this.addressRepository.update(addressId, updatedAddressData);
        }
      }
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

  private async getAddressIdForPractitionerId(
    practitionerId: string,
  ): Promise<string> {
    try {
      const rawResult: {
        address_id: string;
      } = await this.practitionerRepository
        .createQueryBuilder('practitioner')
        .select(['practitioner.address_id'])
        .where('practitioner.id = :practitionerId', {
          practitionerId: practitionerId,
        })
        .getRawOne();
      if (rawResult) {
        return rawResult.address_id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
