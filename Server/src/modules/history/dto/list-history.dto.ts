import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EventQueryFiltersDto } from '../../../common/dto/event-query-filters.dto';
import { HISTORY_EVENT_SOURCE_VALUES, HistoryEventSource } from '../constants/history.enums';

const normalizeCsvArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

export class ListHistoryDto extends EventQueryFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeCsvArray(value))
  @IsArray()
  @IsEnum(HistoryEventSource, { each: true })
  readonly source?: HistoryEventSource[];
}

export { HISTORY_EVENT_SOURCE_VALUES };
