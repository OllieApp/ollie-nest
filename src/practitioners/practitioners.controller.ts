import { PractitionerIdsForUser } from './dto/practitioner-for-user.dto';
import { timeFormat } from './constants';
import { CreatePractitionerRequest } from './requests/create-practitioner.request';
import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PractitionersService } from './services/practitioners.service';
import {
  Body,
  Param,
  UploadedFile,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PractitionerDto } from './dto/practitioner.dto';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import { PractitionerSchedulesService } from './services/practitioner-schedules.service';
import { format } from 'date-fns';
import { UpdatePractitionerRequest } from './requests/update-practitioner.request';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors';
import { PHOTO_ALLOWED_EXTENSIONS } from 'src/constants';

@Controller('/practitioners')
export class PractitionersController {
  constructor(
    private readonly practitionersService: PractitionersService,
    private readonly schedulesService: PractitionerSchedulesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard('firebase'))
  async create(
    @Request() req,
    @Body() createPractitionerDto: CreatePractitionerRequest,
  ): Promise<PractitionerDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    const practitioner = await this.practitionersService.createPractitioner(
      user.id,
      createPractitionerDto,
    );

    practitioner.schedules = await this.schedulesService.injectDefaultSchedule(
      practitioner.id,
    );

    return new PractitionerDto({
      ...practitioner,
      medicalAids: [],
      category: practitioner.category.id,
      location: null,
      schedules: practitioner.schedules.map(s => ({
        daysOfWeek: [s.dayOfWeek],
        startTime: this.mapDateToTimeString(s.startTime),
        endTime: this.mapDateToTimeString(s.endTime),
      })),
      languages: [],
    });
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard('firebase'))
  async get(
    @Request() req,
    @Param('id') practitionerId: string,
  ): Promise<PractitionerDto> {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    const practitioner = await this.practitionersService.getPractitionerForUserId(
      practitionerId,
      userId,
    );

    if (!practitioner) {
      throw new NotFoundException({
        message: 'The requested practitioner was not found.',
      });
    }

    return new PractitionerDto({
      ...practitioner,
      schedules: practitioner.schedules.map(s => ({
        daysOfWeek: [s.dayOfWeek],
        startTime: this.mapDateToTimeString(s.startTime),
        endTime: this.mapDateToTimeString(s.endTime),
      })),
      category: practitioner.category.id,
      medicalAids: practitioner.medicalAids.map(m => m.id),
      location: practitioner.location
        ? {
            latitude: practitioner.location.bbox[0],
            longitude: practitioner.location.bbox[1],
          }
        : null,
      languages: practitioner.languages.map(l => l.id),
    });
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard('firebase'))
  async getPractitionerIds(
    @Request() req,
    @Param('id') id: string,
  ): Promise<PractitionerIdsForUser> {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    return new PractitionerIdsForUser(
      await this.practitionersService.getPractitionersIdsForUserId(userId),
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard('firebase'))
  async update(
    @Request() req,
    @Param('id') practitionerId: string,
    @Body() updatePractitionerDto: UpdatePractitionerRequest,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    const userPractitionersIds = await this.practitionersService.getPractitionersIdsForUserId(
      userId,
    );
    if (!userPractitionersIds.some(id => id == practitionerId)) {
      throw new NotFoundException({
        message: 'The practitioner to be updated could not be found.',
      });
    }

    await this.practitionersService.updatePractitioner(
      practitionerId,
      updatePractitionerDto,
    );
    if (
      updatePractitionerDto.schedules &&
      updatePractitionerDto.schedules.length != 0
    ) {
      await this.schedulesService.replaceCurrentSchedules(
        updatePractitionerDto.schedules,
        practitionerId,
      );
    }
  }

  @Post('avatar/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
      },
    }),
  )
  @UseGuards(AuthGuard('firebase'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file,
    @Param('id') practitionerId: string,
  ): Promise<string> {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    const userPractitionersIds = await this.practitionersService.getPractitionersIdsForUserId(
      userId,
    );
    if (!userPractitionersIds.some(id => id == practitionerId)) {
      throw new NotFoundException({
        message: 'The practitioner to be updated could not be found.',
      });
    }
    if (!req.file) {
      throw new BadRequestException({
        message: 'The image to be uploaded was missing from the request.',
      });
    }
    if (!PHOTO_ALLOWED_EXTENSIONS.test(file.mimetype)) {
      throw new BadRequestException({
        message: 'Only the following types are supported: JPG, JPEG and PNG.',
      });
    }
    return await this.practitionersService.updateAvatar(
      file,
      practitionerId,
      file.mimetype,
    );
  }

  private mapDateToTimeString(date: Date): string {
    return format(date, timeFormat);
  }
}
