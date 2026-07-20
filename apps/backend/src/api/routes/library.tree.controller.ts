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
import { LibraryTreeService } from '@gitroom/nestjs-libraries/database/prisma/library/library.tree.service';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { User } from '@prisma/client';

// PostaRocket: Biblioteca B2 — hierarquia, packs e gestão em massa.
// Leitura para todos os tenants; escrita apenas superadmin.
@ApiTags('LibraryTree')
@Controller('/library')
export class LibraryTreeController {
  constructor(private _tree: LibraryTreeService) {}

  private admin(user: User) {
    if (!user?.isSuperAdmin) throw new HttpException('Somente superadmin', 403);
  }

  // ---------- Hierarquia (leitura) ----------
  @Get('/segments')
  segments(@Query('nicheId') nicheId?: string) {
    return this._tree.getSegments(nicheId);
  }

  @Get('/categories')
  categories(@Query('segmentId') segmentId?: string) {
    return this._tree.getCategories(segmentId);
  }

  @Get('/packs')
  packs(@Query('nicheId') nicheId?: string, @Query('segmentId') segmentId?: string) {
    return this._tree.getPacksWithCount({ nicheId, segmentId });
  }

  @Get('/files')
  files(
    @Query('nicheId') nicheId?: string,
    @Query('segmentId') segmentId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('packId') packId?: string,
    @Query('orientation') orientation?: string,
    @Query('approval') approval?: string,
    @Query('type') type?: string,
    @Query('q') q?: string
  ) {
    return this._tree.listMedias({
      nicheId, segmentId, categoryId, packId, orientation, approval, type, q,
    });
  }

  // ---------- Escrita (superadmin) ----------
  @Post('/segments')
  createSegment(@GetUserFromRequest() user: User, @Body() body: any) {
    this.admin(user);
    return this._tree.createSegment(body);
  }

  @Delete('/segments/:id')
  deleteSegment(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.admin(user);
    return this._tree.deleteSegment(id);
  }

  @Post('/categories')
  createCategory(@GetUserFromRequest() user: User, @Body() body: any) {
    this.admin(user);
    return this._tree.createCategory(body);
  }

  @Delete('/categories/:id')
  deleteCategory(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.admin(user);
    return this._tree.deleteCategory(id);
  }

  @Post('/packs')
  createPack(@GetUserFromRequest() user: User, @Body() body: any) {
    this.admin(user);
    return this._tree.createPack(body);
  }

  @Put('/packs/:id')
  updatePack(@GetUserFromRequest() user: User, @Param('id') id: string, @Body() body: any) {
    this.admin(user);
    return this._tree.updatePack(id, body);
  }

  @Delete('/packs/:id')
  deletePack(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.admin(user);
    return this._tree.deletePack(id);
  }

  // Upload em massa (arquivos já enviados ou links)
  @Post('/files/bulk-create')
  bulkCreate(@GetUserFromRequest() user: User, @Body() body: { items: any[] }) {
    this.admin(user);
    return this._tree.createMedias(body?.items || []);
  }

  @Put('/files/:id')
  updateFile(@GetUserFromRequest() user: User, @Param('id') id: string, @Body() body: any) {
    this.admin(user);
    return this._tree.updateMedia(id, body);
  }

  @Delete('/files/:id')
  deleteFile(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.admin(user);
    return this._tree.deleteMedia(id);
  }

  // Ações em massa: delete | approve | classify | deactivate
  @Post('/files/bulk-action')
  bulkAction(
    @GetUserFromRequest() user: User,
    @Body() body: { action: string; ids: string[]; payload?: any }
  ) {
    this.admin(user);
    return this._tree.bulk(body?.action, body?.ids || [], body?.payload || {});
  }
}
