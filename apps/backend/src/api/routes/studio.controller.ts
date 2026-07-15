import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/studio.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';

// PostaRocket: Estúdio de IA (copy). Toda geração consome créditos.
@ApiTags('Studio')
@Controller('/studio')
export class StudioController {
  constructor(private _studio: StudioService) {}

  @Get('/tools')
  tools() {
    return this._studio.listTools();
  }

  @Post('/copy')
  copy(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { tool: string; prompt: string }
  ) {
    return this._studio.generateCopy(org.id, body.tool, body.prompt);
  }
}
