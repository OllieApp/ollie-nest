import { PractitionerVideoAppointmentDetailsPayload } from './payloads/practitioner-video-appointment-details.payload';
import { PractitionerAppointmentCancelledByUserPayload } from './payloads/practitioner-appointment-cancelled.payload';
import { PractitionerAppointmentCancelledByUserRequest } from './requests/practitioner-appointment-cancelled.request';
import { UserAppointmentCancelledByPractitionerPayload } from './payloads/user-appointment-cancelled.payload';
import { UserAppointmentCancelledByPractitionerRequest } from './requests/user-appointment-cancelled.request';
import { DateTime } from 'luxon';
import { UserAppointmentConfirmedPayload } from './payloads/user-appointment-confirmed.payload';
import { UserAppointmentConfirmedRequest } from './requests/user-appointment-confirmed.request';
import {
  welcomeEmailTemplateId,
  userAppointmentConfirmedTemplateId,
  timeFormat,
  weekdayFormat,
  dateFormat,
  ollieSendFromEmail,
  practitionerAppointmentReceivedTemplateId,
  userAppointmentCancelledByPractitionerTemplateId,
  practitionerAppointmentCancelledByUserTemplateId,
  practitionerVideoAppointmentDetailsTemplateId,
  userVideoAppointmentDetailsTemplateId,
} from './constants';
import { Injectable } from '@nestjs/common';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
import { mapPractitionerCategoryToString } from 'src/shared/utils/utilts';
import { PractitionerAppointmentReceivedPayload } from './payloads/practitioner-appointment-received.payload';
import { PractitionerAppointmentReceivedRequest } from './requests/practitioner-appointment-received.request';
import { PractitionerVideoAppointmentDetailsRequest } from './requests/practitioner-video-appointment-details.request';
import { UserVideoAppointmentDetailsRequest } from './requests/user-video-appointment-details.request';
import { UserVideoAppointmentDetailsPayload } from './payloads/user-video-appointment-details.payload';

//TODO: Format the date to User's region when we have that information
@Injectable()
export class EmailSenderService {
  public constructor(
    @InjectSendGrid() private readonly sendgrid: SendGridService,
  ) {}

  async sendWelcomeEmail(userEmail: string) {
    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFromEmail,
      templateId: welcomeEmailTemplateId,
    });
  }

  async sendUserAppointmentConfirmed(
    userEmail: string,
    request: UserAppointmentConfirmedRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: UserAppointmentConfirmedPayload = {
      isVirtual: request.isVirtual,
      practitioner: {
        title: request.practitionerTitle,
        address: request.practitionerAddress,
        avatarUrl: request.practitionerAvatarUrl,
        category: mapPractitionerCategoryToString(request.practitionerCategory),
      },
      user: {
        firstName: request.userFirstName,
      },
      userNotes: request.userNotes ?? undefined,
      startTimeLong: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
      startTimeShort: `${luxonDate.toFormat(timeFormat)}, ${luxonDate.toFormat(
        weekdayFormat,
      )}`,
    };

    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFromEmail,
      templateId: userAppointmentConfirmedTemplateId,
      dynamicTemplateData: templateData,
    });
  }
  async sendPractitionerAppointmentReceived(
    practitionerEmail: string,
    request: PractitionerAppointmentReceivedRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: PractitionerAppointmentReceivedPayload = {
      isVirtual: request.isVirtual,
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
        lastName: request.userLastName,
        avatarUrl: request.userAvatarUrl,
      },
      userNotes: request.userNotes ?? undefined,
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: practitionerEmail,
      from: ollieSendFromEmail,
      templateId: practitionerAppointmentReceivedTemplateId,
      dynamicTemplateData: templateData,
    });
  }
  async sendUserAppointmentCancelledByPractitioner(
    userEmail: string,
    request: UserAppointmentCancelledByPractitionerRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: UserAppointmentCancelledByPractitionerPayload = {
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
      },
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFromEmail,
      templateId: userAppointmentCancelledByPractitionerTemplateId,
      dynamicTemplateData: templateData,
    });
  }

  async sendPractitionerAppointmentCancelledByUser(
    practitionerEmail: string,
    request: PractitionerAppointmentCancelledByUserRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: PractitionerAppointmentCancelledByUserPayload = {
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
        lastName: request.userLastName,
      },
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: practitionerEmail,
      from: ollieSendFromEmail,
      templateId: practitionerAppointmentCancelledByUserTemplateId,
      dynamicTemplateData: templateData,
    });
  }

  async sendPracitionerVideoAppointmentDetails(
    practitionerEmail: string,
    request: PractitionerVideoAppointmentDetailsRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: PractitionerVideoAppointmentDetailsPayload = {
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
        lastName: request.userLastName,
      },
      roomUrl: request.practitionerVideoUrl,
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: practitionerEmail,
      from: ollieSendFromEmail,
      templateId: practitionerVideoAppointmentDetailsTemplateId,
      dynamicTemplateData: templateData,
    });
  }

  async sendUserVideoAppointmentDetails(
    userEmail: string,
    request: UserVideoAppointmentDetailsRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'SAST',
    );

    const templateData: UserVideoAppointmentDetailsPayload = {
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
      },
      roomUrl: request.practitionerVideoUrl,
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFromEmail,
      templateId: userVideoAppointmentDetailsTemplateId,
      dynamicTemplateData: templateData,
    });
  }
}
