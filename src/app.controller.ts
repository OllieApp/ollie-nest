import { Controller, Get, Post, Request, Res } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('ping')
  pong(): string {
    return 'pong';
  }

  @Post('/app/callbacks/sign_in_with_apple')
  fetchIntentCallback(@Request() request, @Res() response) {
    const urlSearchParams = new URLSearchParams(request.body);
    const redirectUri = `intent://callback?${urlSearchParams.toString()}#Intent;package=${
      process.env.ANDROID_PACKAGE_IDENTIFIER
    };scheme=signinwithapple;end`;
    response.redirect(307, redirectUri);
  }
}
