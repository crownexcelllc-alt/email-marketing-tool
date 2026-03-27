import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';
import {
  TemplateListResponse,
  TemplatePreviewResponse,
  TemplateResponse,
} from './types/template.response';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<TemplateResponse> {
    return this.templatesService.create(dto, authUser);
  }

  @Get()
  findAll(
    @Query() query: ListTemplatesDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<TemplateListResponse> {
    return this.templatesService.findAll(query, authUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<TemplateResponse> {
    return this.templatesService.findOne(id, authUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<TemplateResponse> {
    return this.templatesService.update(id, dto, authUser);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ deleted: true; id: string }> {
    return this.templatesService.remove(id, authUser);
  }

  @Post(':id/preview')
  preview(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: PreviewTemplateDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<TemplatePreviewResponse> {
    return this.templatesService.preview(id, dto, authUser);
  }
}
