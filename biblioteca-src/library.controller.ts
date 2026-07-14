import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LibraryService } from '@gitroom/nestjs-libraries/database/prisma/library/library.service';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { User } from '@prisma/client';

// PostaRocket: Biblioteca Rocket — leitura para todos os tenants,
// escrita restrita ao superadmin (curadoria central do conteúdo).
@ApiTags('Library')
@Controller('/library')
export class LibraryController {
  constructor(private _libraryService: LibraryService) {}

  private ensureAdmin(user: User) {
    if (!user?.isSuperAdmin) {
      throw new HttpException('Somente superadmin', 403);
    }
  }

  // ---------- Leitura (qualquer usuário logado) ----------
  @Get('/niches')
  niches() {
    return this._libraryService.getNiches(true);
  }

  @Get('/medias')
  medias(
    @Query('nicheId') nicheId?: string,
    @Query('category') category?: string
  ) {
    return this._libraryService.getMedias({ nicheId, category });
  }

  @Get('/ads')
  ads(
    @Query('nicheId') nicheId?: string,
    @Query('category') category?: string
  ) {
    return this._libraryService.getAds({ nicheId, category });
  }

  // ---------- Escrita (somente superadmin) ----------
  @Get('/admin/niches')
  adminNiches(@GetUserFromRequest() user: User) {
    this.ensureAdmin(user);
    return this._libraryService.getNiches(false);
  }

  @Post('/niches')
  createNiche(@GetUserFromRequest() user: User, @Body() body: any) {
    this.ensureAdmin(user);
    return this._libraryService.createNiche(body);
  }

  @Put('/niches/:id')
  updateNiche(
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: any
  ) {
    this.ensureAdmin(user);
    return this._libraryService.updateNiche(id, body);
  }

  @Delete('/niches/:id')
  deleteNiche(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.ensureAdmin(user);
    return this._libraryService.deleteNiche(id);
  }

  @Post('/medias')
  createMedia(@GetUserFromRequest() user: User, @Body() body: any) {
    this.ensureAdmin(user);
    return this._libraryService.createMedia(body);
  }

  @Delete('/medias/:id')
  deleteMedia(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.ensureAdmin(user);
    return this._libraryService.deleteMedia(id);
  }

  @Post('/ads')
  createAd(@GetUserFromRequest() user: User, @Body() body: any) {
    this.ensureAdmin(user);
    return this._libraryService.createAd(body);
  }

  @Delete('/ads/:id')
  deleteAd(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.ensureAdmin(user);
    return this._libraryService.deleteAd(id);
  }
}
