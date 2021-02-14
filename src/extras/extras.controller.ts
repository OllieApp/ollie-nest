import { CovidTestingNextPathologyRequest } from './requests/covid-testing.request';
import { EmailSenderService } from '../integrations/email-sender/email-sender.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { FirebaseUser } from '@tfarras/nestjs-firebase-admin';
import ExtrasService from './services/extras.service';

@Controller('/extras')
export class ExtrasController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailSenderService,
    private readonly extrasService: ExtrasService,
  ) {}

  @Post('/next-path-covid-test')
  @UseGuards(AuthGuard('firebase'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createNextPathCovidTestingRequest(
    @Request() req,
    @Body() covidTestingReq: CovidTestingNextPathologyRequest,
  ): Promise<void> {
    const firebaseUser = req.user as FirebaseUser;
    const userId = await this.usersService.getUserIdForUid(firebaseUser.uid);

    await this.extrasService.requestCovidTestingWithNextPath(
      userId,
      covidTestingReq,
    );

    // send emails to next path
  }
}
