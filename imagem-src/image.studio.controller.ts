import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ImageStudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/image.studio.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { HttpException } from '@nestjs/common';

// PostaRocket: Estúdio de IA — geração de imagens (consome créditos)
@ApiTags('ImageStudio')
@Controller('/studio/image')
export class ImageStudioController {
  constructor(private _image: ImageStudioService) {}

  private ensureAdmin(user: User) {
    if (!user?.isSuperAdmin) throw new HttpException('Somente superadmin', 403);
  }

  @Get('/models')
  models() {
    return this._image.listModels(true);
  }

  @Post('/generate')
  generate(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { model: string; prompt: string; format?: string }
  ) {
    return this._image.generate(org.id, body.model, body.prompt, body.format);
  }

  // ---------- Admin ----------
  @Get('/admin/models')
  adminModels(@GetUserFromRequest() user: User) {
    this.ensureAdmin(user);
    return this._image.listModels(false);
  }

  @Post('/admin/models')
  create(@GetUserFromRequest() user: User, @Body() body: any) {
    this.ensureAdmin(user);
    return this._image.createModel(body);
  }

  @Put('/admin/models/:id')
  update(@GetUserFromRequest() user: User, @Param('id') id: string, @Body() body: any) {
    this.ensureAdmin(user);
    return this._image.updateModel(id, body);
  }

  @Delete('/admin/models/:id')
  remove(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.ensureAdmin(user);
    return this._image.deleteModel(id);
  }

  @Post('/admin/seed')
  seed(@GetUserFromRequest() user: User) {
    this.ensureAdmin(user);
    return this._image.seedDefaults();
  }
}
