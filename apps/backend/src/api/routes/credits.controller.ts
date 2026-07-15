import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { HttpException } from '@nestjs/common';

// PostaRocket: Carteira de Créditos (pré-pago)
@ApiTags('Credits')
@Controller('/credits')
export class CreditsController {
  constructor(private _credits: CreditsService) {}

  private ensureAdmin(user: User) {
    if (!user?.isSuperAdmin) throw new HttpException('Somente superadmin', 403);
  }

  // ---------- Cliente ----------
  @Get('/wallet')
  async wallet(@GetOrgFromRequest() org: Organization) {
    const balance = await this._credits.getBalance(org.id);
    return { balance, reais: (balance / 100).toFixed(2) };
  }

  @Get('/history')
  history(@GetOrgFromRequest() org: Organization) {
    return this._credits.history(org.id);
  }

  @Get('/packages')
  packages() {
    return this._credits.getPackages(true);
  }

  @Get('/prices')
  prices() {
    return this._credits.getActionPrices();
  }

  // ---------- Admin ----------
  @Get('/admin/packages')
  adminPackages(@GetUserFromRequest() user: User) {
    this.ensureAdmin(user);
    return this._credits.getPackages(false);
  }

  @Post('/admin/packages')
  createPackage(@GetUserFromRequest() user: User, @Body() body: any) {
    this.ensureAdmin(user);
    return this._credits.createPackage(body);
  }

  @Put('/admin/packages/:id')
  updatePackage(
    @GetUserFromRequest() user: User,
    @Param('id') id: string,
    @Body() body: any
  ) {
    this.ensureAdmin(user);
    return this._credits.updatePackage(id, body);
  }

  @Delete('/admin/packages/:id')
  deletePackage(@GetUserFromRequest() user: User, @Param('id') id: string) {
    this.ensureAdmin(user);
    return this._credits.deletePackage(id);
  }

  @Put('/admin/prices/:action')
  setPrice(
    @GetUserFromRequest() user: User,
    @Param('action') action: string,
    @Body() body: { label: string; cost: number; active?: boolean }
  ) {
    this.ensureAdmin(user);
    return this._credits.upsertActionPrice(action, body);
  }

  // Crédito manual (admin dá créditos a uma org — testes, cortesia)
  @Post('/admin/grant')
  grant(
    @GetUserFromRequest() user: User,
    @Body() body: { orgId: string; amount: number; description?: string }
  ) {
    this.ensureAdmin(user);
    return this._credits.credit(body.orgId, body.amount, 'ajuste', {
      description: body.description || 'Crédito manual (admin)',
    });
  }

  @Post('/admin/seed')
  seed(@GetUserFromRequest() user: User) {
    this.ensureAdmin(user);
    return this._credits.seedDefaults();
  }
}
