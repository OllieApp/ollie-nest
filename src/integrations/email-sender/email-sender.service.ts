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

  async sendgridIntegrate() {
    await this.sendgrid.send({
      to: 'test@example.com', // Change to your recipient
      from: 'test@example.com', // Change to your verified sender
      subject: 'Sending with SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    });
  }
}
