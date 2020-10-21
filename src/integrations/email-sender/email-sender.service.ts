import { ollieNoReply } from './constants';
import { Injectable } from '@nestjs/common';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';

@Injectable()
export class EmailSenderService {
  public constructor(
    @InjectSendGrid() private readonly sendgrid: SendGridService,
  ) {}

  async sendWelcomeEmail(userEmail: string) {
    const templateId = '213123';
    await this.sendgrid.send({
      to: userEmail,
      from: ollieNoReply,
      templateId,
      dynamicTemplateData: {},
    });
  }
}
