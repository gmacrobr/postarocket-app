import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandKitService } from '@gitroom/nestjs-libraries/database/prisma/brandkit/brandkit.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';

// PostaRocket: Kit de Marca — cada tenant gerencia o seu.
@ApiTags('BrandKit')
@Controller('/brand')
export class BrandKitController {
  constructor(private _brand: BrandKitService) {}

  @Get('/kit')
  get(@GetOrgFromRequest() org: Organization) {
    return this._brand.get(org.id);
  }

  @Get('/kit/status')
  status(@GetOrgFromRequest() org: Organization) {
    return this._brand.completeness(org.id);
  }

  @Post('/kit')
  save(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this._brand.save(org.id, body);
  }
}
