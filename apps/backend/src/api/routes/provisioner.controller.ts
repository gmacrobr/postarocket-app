import { Body, Controller, Headers, HttpException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { CreateOrgUserDto } from '@gitroom/nestjs-libraries/dtos/auth/create.org.user.dto';
import { Provider } from '@prisma/client';
import { randomBytes } from 'crypto';

// PostaRocket: provisionador interno de contas (Control Rocket / Asaas)
@ApiTags('Provisioner')
@Controller('/provisioner')
export class ProvisionerController {
  constructor(private _organizationService: OrganizationService) {}

  @Post('/create')
  async create(
    @Headers('x-provisioner-key') key: string,
    @Body() body: { email: string; company: string }
  ) {
    const secret = process.env.PROVISIONER_SECRET;
    if (!secret || !key || key !== secret) {
      throw new HttpException('Unauthorized', 401);
    }
    if (!body?.email || !body?.company) {
      throw new HttpException('email e company sao obrigatorios', 400);
    }

    const email = String(body.email).toLowerCase().trim();
    const password = randomBytes(9).toString('base64url');

    const dto = new CreateOrgUserDto();
    dto.email = email;
    dto.password = password;
    dto.company = String(body.company).trim();
    dto.provider = Provider.LOCAL;

    try {
      const create = await this._organizationService.createOrgAndUser(
        dto,
        '127.0.0.1',
        'postarocket-provisioner'
      );
      return {
        ok: true,
        orgId: create.id,
        userId: create.users[0].user.id,
        login: email,
        senha: password,
        painel: process.env.FRONTEND_URL,
      };
    } catch (err: any) {
      const msg = String(err?.message || 'Erro ao provisionar');
      const friendly = msg.includes('Unique') || msg.includes('exists')
        ? 'E-mail ja cadastrado'
        : msg;
      throw new HttpException(friendly, 400);
    }
  }
}
