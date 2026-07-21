import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LibraryRequestService } from '@gitroom/nestjs-libraries/database/prisma/library/library.request.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';

// PostaRocket: Solicitar artes (B4)
@ApiTags('LibraryRequests')
@Controller('/library-requests')
export class LibraryRequestController {
  constructor(private _req: LibraryRequestService) {}

  private admin(user: User) {
    if (!user?.isSuperAdmin) throw new HttpException('Somente superadmin', 403);
  }

  // ---------- Cliente ----------
  @Get('/mine')
  mine(@GetOrgFromRequest() org: Organization) {
    return this._req.listMine(org.id);
  }

  @Post('/')
  create(@GetOrgFromRequest() org: Organization, @Body() body: any) {
    return this._req.create(org.id, body);
  }

  @Delete('/mine/:id')
  cancel(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._req.cancelMine(org.id, id);
  }

  // ---------- Admin ----------
  @Get('/all')
  all(@GetUserFromRequest() user: User, @Query('status') status?: string) {
    this.admin(user);
    return this._req.listAll(status);
  }

  @Get('/counts')
  counts(@GetUserFromRequest() user: User) {
    this.admin(user);
    return this._req.counts();
  }

  @Put('/:id')
  update(@GetUserFromRequest() user: User, @Param('id') id: string, @Body() body: any) {
    this.admin(user);
    return this._req.update(id, body);
  }

  @Delete('/:id')
  remove(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.admin(user);
    return this._req.remove(id);
  }
}
