import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WherebyMeetingsService } from './whereby-meetings.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('WHEREBY_REQUEST_HTTP_TIMEOUT'),
        baseURL: configService.get('WHEREBY_BASE_URL'),
        headers: {
          Authorization: `Bearer ${configService.get('WHEREBY_API_TOKEN')}`,
        },
      }),
    }),
  ],
  providers: [WherebyMeetingsService],
  exports: [WherebyMeetingsService],
})
export class WherebyMeetingsModule {}
