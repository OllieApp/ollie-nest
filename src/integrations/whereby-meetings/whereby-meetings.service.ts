import { Meeting } from './dto/meeting.dto';
import { DeleteMeetingRequest } from './requests/delete-meeting.request';
import { GetMeetingRequest } from './requests/get-meeting.request';
import { CreateMeetingRequest } from './requests/create-meeting.request';
import {
  HttpService,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class WherebyMeetingsService {
  constructor(private httpService: HttpService) {}
  private CREATE_MEETING_ENDPOINT = '/meetings';
  private GET_MEETING_ENDPOINT = '/meetings/{meetingId}';
  private DELETE_MEETING_ENDPOINT = '/meetings/{meetingId}';

  private readonly logger = new Logger(WherebyMeetingsService.name);

  async createMeeting(request: CreateMeetingRequest): Promise<Meeting> {
    try {
      const res = await this.httpService
        .post(this.CREATE_MEETING_ENDPOINT, request)
        .toPromise();
      if (res.status != HttpStatus.CREATED) {
        throw new InternalServerErrorException({
          message: ['Could not generate the Whereby meeting.'],
        });
      }
      return res.data as Meeting;
    } catch (error) {
      this.logger.error(
        `Something went wrong while trying to create a meeting. ${error}`,
      );
      throw error;
    }
  }

  async getMeeting(request: GetMeetingRequest): Promise<Meeting> {
    const queryParameters = request.fields.map(e => e.toString()).join('&');
    try {
      const res = await this.httpService
        .get(
          `${this.GET_MEETING_ENDPOINT.replace(
            '{meetingId}',
            request.meetingId,
          )}${request.fields.length != 0 ? '?' + queryParameters : ''}`,
        )
        .toPromise();
      if (res.status != HttpStatus.OK) {
        throw new InternalServerErrorException({
          message: ['Could not get the Whereby meeting.'],
        });
      }
      return res.data as Meeting;
    } catch (error) {
      this.logger.error(
        `Something went wrong while trying to get the meeting with id ${request.meetingId}. ${error}`,
      );
      throw error;
    }
  }

  async deleteMeeting(request: DeleteMeetingRequest): Promise<boolean> {
    try {
      const res = await this.httpService
        .delete(
          this.DELETE_MEETING_ENDPOINT.replace(
            '{meetingId}',
            request.meetingId,
          ),
        )
        .toPromise();
      if (res.status != HttpStatus.NO_CONTENT) {
        throw new InternalServerErrorException({
          message: ['Could not delete the Whereby meeting.'],
        });
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Something went wrong while trying to delete the meeting with id ${request.meetingId}. ${error}`,
      );
      throw error;
    }
  }
}
