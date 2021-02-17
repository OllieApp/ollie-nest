import { CovidNextPathTestPayload } from './payloads/covid-next-path-test.payload';
import { CovidNextPathTestRequest } from './requests/covid-next-path-test.request';
import { InternalAppointmentCreatedPayload } from './payloads/internal-appointment-created.payload';
import { InternalAppointmentCreatedRequest } from './requests/internal-appointment-created.request';
import { UserAppointmentCancelledConfirmationPayload } from './payloads/user-appointment-cancelled-confirmation.payload';
import { PractitionerAppointmentCancelledConfirmationPayload } from './payloads/practitioner-appointment-cancelled-confirmation.payload';
import { PractitionerAppointmentCancelledConfirmationRequest } from './requests/practitioner-appointment-cancelled-confirmation.request';
import { PractitionerVideoAppointmentDetailsPayload } from './payloads/practitioner-video-appointment-details.payload';
import { PractitionerAppointmentCancelledByUserPayload } from './payloads/practitioner-appointment-cancelled-by-user.payload';
import { PractitionerAppointmentCancelledByUserRequest } from './requests/practitioner-appointment-cancelled-by-user.request';
import { UserAppointmentCancelledByPractitionerPayload } from './payloads/user-appointment-cancelled-by-practitioner.payload';
import { UserAppointmentCancelledByPractitionerRequest } from './requests/user-appointment-cancelled-by-practitioner.request';
import { DateTime } from 'luxon';
import { UserAppointmentConfirmedPayload } from './payloads/user-appointment-confirmed.payload';
import { UserAppointmentConfirmedRequest } from './requests/user-appointment-confirmed.request';
import {
  timeFormat,
  weekdayFormat,
  dateFormat,
  ollieSendFromEmail,
  TemplateIds,
} from './constants';
import { Injectable } from '@nestjs/common';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
import { mapPractitionerCategoryToString } from 'src/shared/utils/utilts';
import { PractitionerAppointmentReceivedPayload } from './payloads/practitioner-appointment-received.payload';
import { PractitionerAppointmentReceivedRequest } from './requests/practitioner-appointment-received.request';
import { PractitionerVideoAppointmentDetailsRequest } from './requests/practitioner-video-appointment-details.request';
import { UserVideoAppointmentDetailsRequest } from './requests/user-video-appointment-details.request';
import { UserVideoAppointmentDetailsPayload } from './payloads/user-video-appointment-details.payload';
import { UserAppointmentCancelledConfirmationRequest } from './requests/user-appointment-cancelled-confirmation.request';

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
      templateId: TemplateIds.welcomeEmail,
    });
  }

  async sendUserAppointmentConfirmed(
    userEmail: string,
    request: UserAppointmentConfirmedRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.userAppointmentConfirmed,
      dynamicTemplateData: templateData,
    });
  }

  async sendPractitionerAppointmentReceived(
    practitionerEmail: string,
    request: PractitionerAppointmentReceivedRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.practitionerAppointmentReceived,
      dynamicTemplateData: templateData,
    });
  }

  async sendUserAppointmentCancelledByPractitioner(
    userEmail: string,
    request: UserAppointmentCancelledByPractitionerRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.userAppointmentCancelledByPractitioner,
      dynamicTemplateData: templateData,
    });
  }

  async sendPractitionerAppointmentCancelledByUser(
    practitionerEmail: string,
    request: PractitionerAppointmentCancelledByUserRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.practitionerAppointmentCancelledByUser,
      dynamicTemplateData: templateData,
    });
  }

  async sendPractitionerVideoAppointmentDetails(
    practitionerEmail: string,
    request: PractitionerVideoAppointmentDetailsRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.practitionerVideoAppointmentDetails,
      dynamicTemplateData: templateData,
    });
  }

  async sendUserVideoAppointmentDetails(
    userEmail: string,
    request: UserVideoAppointmentDetailsRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
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
      templateId: TemplateIds.userVideoAppointmentDetails,
      dynamicTemplateData: templateData,
    });
  }

  async sendPractitionerAppointmentCancelledConfirmation(
    practitionerEmail: string,
    request: PractitionerAppointmentCancelledConfirmationRequest,
  ) {
    const templateData: PractitionerAppointmentCancelledConfirmationPayload = {
      practitioner: {
        title: request.practitionerTitle,
      },
      user: {
        firstName: request.userFirstName,
        email: request.userEmail,
        lastName: request.userLastName,
        phone: request.userPhone,
      },
    };

    await this.sendgrid.send({
      to: practitionerEmail,
      from: ollieSendFromEmail,
      templateId: TemplateIds.practitionerAppointmentCancelledConfirmation,
      dynamicTemplateData: templateData,
    });
  }

  async sendUserAppointmentCancelledConfirmation(
    userEmail: string,
    request: UserAppointmentCancelledConfirmationRequest,
  ) {
    const templateData: UserAppointmentCancelledConfirmationPayload = {
      practitioner: {
        title: request.practitionerTitle,
        email: request.practitionerEmail,
        phone: request.practitionerPhone,
      },
      user: {
        firstName: request.userFirstName,
      },
    };

    await this.sendgrid.send({
      to: userEmail,
      from: ollieSendFromEmail,
      templateId: TemplateIds.userAppointmentCancelledConfirmation,
      dynamicTemplateData: templateData,
    });
  }

  async sendInternalAppointmentCreated(
    request: InternalAppointmentCreatedRequest,
  ) {
    const luxonDate = DateTime.fromJSDate(request.appointmentStartTime).setZone(
      'Africa/Johannesburg',
    );

    const templateData: InternalAppointmentCreatedPayload = {
      practitioner: {
        title: request.practitionerTitle,
        email: request.practitionerEmail,
        phone: request.practitionerPhone,
      },
      user: {
        firstName: request.userFirstName,
        lastName: request.userLastName,
        phone: request.userPhone,
        email: request.userEmail,
      },
      isVirtual: request.appointmentIsVirtual,
      startTime: `${luxonDate.toFormat(timeFormat)} on ${luxonDate.toFormat(
        weekdayFormat,
      )}, ${luxonDate.toFormat(dateFormat)}`,
    };

    await this.sendgrid.send({
      to: ['marc@ollie.health', 'cameron@ollie.health'],
      from: ollieSendFromEmail,
      templateId: TemplateIds.internalAppointmentCreated,
      dynamicTemplateData: templateData,
    });
  }

  async sendCovidNextPathTestNotification(request: CovidNextPathTestRequest) {
    const {
      antibodyCount,
      antigenCount,
      createdDate,
      date,
      email,
      fullAddress,
      fullName,
      numberOfPeople,
      pctCount,
      phoneNumber,
      notes,
    } = request;
    const preferredDate = DateTime.fromJSDate(date).setZone(
      'Africa/Johannesburg',
    );
    const creationDate = DateTime.fromJSDate(createdDate).setZone(
      'Africa/Johannesburg',
    );

    const templateData: CovidNextPathTestPayload = {
      createdDate: creationDate.toFormat('dd.MM.yyyy t'),
      date: preferredDate.toFormat('dd.MM.yyyy'),
      email: email,
      fullAddress: fullAddress,
      fullName: fullName,
      numberOfPeople: numberOfPeople,
      phoneNumber: phoneNumber,
      notes: notes,
      testingTypesCount: {
        pctCount: pctCount,
        antibodyCount: antibodyCount,
        antigenCount: antigenCount,
      },
    };

    await this.sendgrid.send({
      to: ['jacky.maulgue@nextbio.co.za', 'bespoke@nextbio.co.za'],
      from: ollieSendFromEmail,
      templateId: TemplateIds.covidNextPathTestNotification,
      dynamicTemplateData: templateData,
    });
  }
}
