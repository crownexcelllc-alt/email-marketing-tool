import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListHistoryDto } from './dto/list-history.dto';
import { HistoryService } from './history.service';
import { HistoryListResponse } from './types/history.response';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  listHistory(
    @Query() query: ListHistoryDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<HistoryListResponse> {
    return this.historyService.listHistory(query, authUser);
  }

  @Get('contacts/:id')
  listContactHistory(
    @Param('id', ParseObjectIdPipe) contactId: string,
    @Query() query: ListHistoryDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<HistoryListResponse> {
    return this.historyService.listContactHistory(contactId, query, authUser);
  }
}
