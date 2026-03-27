import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSuppressionDto } from './dto/create-suppression.dto';
import { ListSuppressionDto } from './dto/list-suppression.dto';
import { SuppressionService } from './suppression.service';
import { SuppressionResponse } from './types/suppression.response';

@Controller('suppression')
@UseGuards(JwtAuthGuard)
export class SuppressionController {
  constructor(private readonly suppressionService: SuppressionService) {}

  @Post()
  create(
    @Body() dto: CreateSuppressionDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SuppressionResponse> {
    return this.suppressionService.create(dto, authUser);
  }

  @Get()
  findAll(
    @Query() query: ListSuppressionDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<SuppressionResponse[]> {
    return this.suppressionService.findAll(query, authUser);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ deleted: true; id: string }> {
    return this.suppressionService.remove(id, authUser);
  }
}
