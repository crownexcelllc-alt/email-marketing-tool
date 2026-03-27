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
import { AddSegmentContactsDto } from './dto/add-segment-contacts.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { ListSegmentsDto } from './dto/list-segments.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { SegmentsService } from './segments.service';
import { SegmentListResponse, SegmentResponse } from './types/segment.response';

@Controller('segments')
@UseGuards(JwtAuthGuard)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  create(
    @Body() dto: CreateSegmentDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentResponse> {
    return this.segmentsService.create(dto, authUser);
  }

  @Get()
  findAll(
    @Query() query: ListSegmentsDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentListResponse> {
    return this.segmentsService.findAll(query, authUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentResponse> {
    return this.segmentsService.findOne(id, authUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateSegmentDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentResponse> {
    return this.segmentsService.update(id, dto, authUser);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ deleted: true; id: string }> {
    return this.segmentsService.remove(id, authUser);
  }

  @Post(':id/contacts')
  addContacts(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AddSegmentContactsDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentResponse> {
    return this.segmentsService.addContacts(id, dto, authUser);
  }

  @Delete(':id/contacts/:contactId')
  removeContact(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('contactId', ParseObjectIdPipe) contactId: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SegmentResponse> {
    return this.segmentsService.removeContact(id, contactId, authUser);
  }
}
