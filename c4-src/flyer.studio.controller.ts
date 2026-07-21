import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlyerStudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/flyer.studio.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';

// PostaRocket: Estúdio de Flyers (consome créditos)
@ApiTags('FlyerStudio')
@Controller('/studio/flyer')
export class FlyerStudioController {
  constructor(private _flyer: FlyerStudioService) {}

  @Post('/generate')
  generate(@GetOrgFromRequest() org: Organization, @Body() body: { prompt: string }) {
    return this._flyer.generate(org.id, body?.prompt);
  }
}
