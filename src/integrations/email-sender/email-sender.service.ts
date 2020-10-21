import { ollieSendFrom, welcomeEmailTemplateId } from './constants';
import { Injectable } from '@nestjs/common';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';

@Injectable()
export class EmailSenderService {
  public constructor(
    @InjectSendGrid() private readonly sendgrid: SendGridService,
  ) {}

  async sendWelcomeEmail(userEmail: string) {
    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFrom,
      templateId: welcomeEmailTemplateId,
      dynamicTemplateData: {},
    });
  }
}
