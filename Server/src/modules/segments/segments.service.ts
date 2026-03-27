import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  ContactEmailStatus,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from '../contacts/constants/contact.enums';
import { Contact } from '../contacts/schemas/contact.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SegmentType } from './constants/segment.enums';
import { AddSegmentContactsDto } from './dto/add-segment-contacts.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { ListSegmentsDto } from './dto/list-segments.dto';
import { SegmentFiltersDto } from './dto/segment-filters.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { Segment, SegmentDocument } from './schemas/segment.schema';
import { SegmentListResponse, SegmentResponse } from './types/segment.response';

interface NormalizedSegmentFilters {
  tags: string[];
  subscriptionStatus: ContactSubscriptionStatus | null;
  emailStatus: ContactEmailStatus | null;
  whatsappStatus: ContactWhatsappStatus | null;
}

@Injectable()
export class SegmentsService {
  constructor(
    @InjectModel(Segment.name)
    private readonly segmentModel: Model<Segment>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(dto: CreateSegmentDto, authUser: AuthUser): Promise<SegmentResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const type = dto.type ?? SegmentType.STATIC;
    if (type === SegmentType.DYNAMIC && dto.contactIds?.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'DYNAMIC_SEGMENT_MANUAL_CONTACTS_NOT_ALLOWED',
        'Dynamic segments cannot include manual contactIds',
      );
    }

    const contactIds =
      type === SegmentType.STATIC
        ? await this.validateWorkspaceContactIds(workspaceId, dto.contactIds ?? [])
        : [];

    const filters = this.normalizeFilters(dto.filters);

    const segment = new this.segmentModel({
      workspaceId: this.toObjectId(workspaceId),
      name: dto.name.trim(),
      description: this.cleanString(dto.description),
      type,
      filters,
      contactIds,
      estimatedCount: 0,
    });

    segment.estimatedCount = await this.calculateEstimatedCount(workspaceId, filters, contactIds);
    const saved = await segment.save();

    return this.toResponse(saved);
  }

  async findAll(query: ListSegmentsDto, authUser: AuthUser): Promise<SegmentListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, unknown> = {
      workspaceId: this.toObjectId(workspaceId),
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search?.trim()) {
      filter.name = new RegExp(this.escapeRegex(query.search.trim()), 'i');
    }

    if (query.tags?.length) {
      filter['filters.tags'] = { $in: query.tags.map((tag) => tag.trim()).filter(Boolean) };
    }

    if (query.subscriptionStatus) {
      filter['filters.subscriptionStatus'] = query.subscriptionStatus;
    }

    const [segments, total] = await Promise.all([
      this.segmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.segmentModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: segments.map((segment) => this.toResponse(segment)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string, authUser: AuthUser): Promise<SegmentResponse> {
    const segment = await this.findOwnedSegment(id, authUser);
    return this.toResponse(segment);
  }

  async update(id: string, dto: UpdateSegmentDto, authUser: AuthUser): Promise<SegmentResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const segment = await this.findOwnedSegment(id, authUser);

    const nextType = dto.type ?? segment.type;

    if (nextType === SegmentType.DYNAMIC && dto.contactIds?.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'DYNAMIC_SEGMENT_MANUAL_CONTACTS_NOT_ALLOWED',
        'Dynamic segments cannot include manual contactIds',
      );
    }

    if (dto.name !== undefined) {
      segment.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      segment.description = this.cleanString(dto.description);
    }

    if (dto.type !== undefined) {
      segment.type = dto.type;
      if (dto.type === SegmentType.DYNAMIC) {
        segment.contactIds = [];
      }
    }

    if (dto.filters !== undefined) {
      segment.filters = this.normalizeFilters(dto.filters);
    }

    if (dto.contactIds !== undefined) {
      if (segment.type !== SegmentType.STATIC) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'DYNAMIC_SEGMENT_MANUAL_CONTACTS_NOT_ALLOWED',
          'Dynamic segments cannot include manual contactIds',
        );
      }

      segment.contactIds = await this.validateWorkspaceContactIds(workspaceId, dto.contactIds);
    }

    const filters = this.normalizeFilters(segment.filters as SegmentFiltersDto);
    const manualContacts = segment.type === SegmentType.STATIC ? segment.contactIds : [];

    segment.estimatedCount = await this.calculateEstimatedCount(
      workspaceId,
      filters,
      manualContacts,
    );

    const saved = await segment.save();
    return this.toResponse(saved);
  }

  async remove(id: string, authUser: AuthUser): Promise<{ deleted: true; id: string }> {
    const segment = await this.findOwnedSegment(id, authUser);
    await this.segmentModel.deleteOne({ _id: segment._id }).exec();

    return {
      deleted: true,
      id,
    };
  }

  async addContacts(
    id: string,
    dto: AddSegmentContactsDto,
    authUser: AuthUser,
  ): Promise<SegmentResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const segment = await this.findOwnedSegment(id, authUser);

    this.assertStaticSegment(segment.type);

    const validContactIds = await this.validateWorkspaceContactIds(workspaceId, dto.contactIds);

    const merged = Array.from(
      new Set([...segment.contactIds.map((contactId) => contactId.toString()), ...validContactIds]),
    ).map((contactId) => this.toObjectId(String(contactId)));

    segment.contactIds = merged;

    const filters = this.normalizeFilters(segment.filters as SegmentFiltersDto);
    segment.estimatedCount = await this.calculateEstimatedCount(workspaceId, filters, merged);

    const saved = await segment.save();
    return this.toResponse(saved);
  }

  async removeContact(id: string, contactId: string, authUser: AuthUser): Promise<SegmentResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const segment = await this.findOwnedSegment(id, authUser);

    this.assertStaticSegment(segment.type);

    const nextContactIds = segment.contactIds.filter(
      (existingId) => existingId.toString() !== contactId,
    );

    segment.contactIds = nextContactIds;

    const filters = this.normalizeFilters(segment.filters as SegmentFiltersDto);
    segment.estimatedCount = await this.calculateEstimatedCount(
      workspaceId,
      filters,
      nextContactIds,
    );

    const saved = await segment.save();
    return this.toResponse(saved);
  }

  private async findOwnedSegment(id: string, authUser: AuthUser): Promise<SegmentDocument> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const segment = await this.segmentModel
      .findOne({
        _id: this.toObjectId(id),
        workspaceId: this.toObjectId(workspaceId),
      })
      .exec();

    if (!segment) {
      throw new AppException(HttpStatus.NOT_FOUND, 'SEGMENT_NOT_FOUND', 'Segment not found');
    }

    return segment;
  }

  private async resolveWorkspaceId(authUser: AuthUser): Promise<string> {
    if (!authUser.workspaceId) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'WORKSPACE_CONTEXT_REQUIRED',
        'workspaceId is required in the authenticated context',
      );
    }

    if (!Types.ObjectId.isValid(authUser.workspaceId)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_WORKSPACE_ID', 'Invalid workspaceId');
    }

    const workspace = await this.workspacesService.findById(authUser.workspaceId);
    if (!workspace) {
      throw new AppException(HttpStatus.NOT_FOUND, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
    }

    return authUser.workspaceId;
  }

  private async validateWorkspaceContactIds(
    workspaceId: string,
    contactIds: string[],
  ): Promise<Types.ObjectId[]> {
    const uniqueIds = Array.from(new Set(contactIds)).map((id) => this.toObjectId(id));

    if (!uniqueIds.length) {
      return [];
    }

    const existingContacts = await this.contactModel
      .find({
        workspaceId: this.toObjectId(workspaceId),
        _id: { $in: uniqueIds },
      })
      .select('_id')
      .lean()
      .exec();

    const existingIdSet = new Set(existingContacts.map((contact) => String(contact._id)));
    const missingIds = uniqueIds.map((id) => id.toString()).filter((id) => !existingIdSet.has(id));

    if (missingIds.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CONTACTS_NOT_IN_WORKSPACE',
        'Some contactIds do not belong to the workspace',
        { missingIds },
      );
    }

    return uniqueIds;
  }

  private async calculateEstimatedCount(
    workspaceId: string,
    filters: NormalizedSegmentFilters,
    contactIds: Types.ObjectId[],
  ): Promise<number> {
    const workspaceObjectId = this.toObjectId(workspaceId);
    const manualContactIds = contactIds.map((contactId) => this.toObjectId(contactId.toString()));

    const filterQuery = this.buildContactFilterQuery(filters);
    const hasFilter = Object.keys(filterQuery).length > 0;
    const hasManual = manualContactIds.length > 0;

    if (!hasFilter && !hasManual) {
      return 0;
    }

    if (hasFilter && hasManual) {
      return this.contactModel.countDocuments({
        workspaceId: workspaceObjectId,
        $or: [filterQuery, { _id: { $in: manualContactIds } }],
      });
    }

    if (hasFilter) {
      return this.contactModel.countDocuments({
        workspaceId: workspaceObjectId,
        ...filterQuery,
      });
    }

    return this.contactModel.countDocuments({
      workspaceId: workspaceObjectId,
      _id: { $in: manualContactIds },
    });
  }

  private buildContactFilterQuery(filters: NormalizedSegmentFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.tags.length) {
      query.tags = { $all: filters.tags };
    }

    if (filters.subscriptionStatus) {
      query.subscriptionStatus = filters.subscriptionStatus;
    }

    if (filters.emailStatus) {
      query.emailStatus = filters.emailStatus;
    }

    if (filters.whatsappStatus) {
      query.whatsappStatus = filters.whatsappStatus;
    }

    return query;
  }

  private normalizeFilters(filters?: SegmentFiltersDto): NormalizedSegmentFilters {
    return {
      tags: Array.from(new Set((filters?.tags ?? []).map((tag) => this.normalizeTag(tag)))).filter(
        Boolean,
      ),
      subscriptionStatus: filters?.subscriptionStatus ?? null,
      emailStatus: filters?.emailStatus ?? null,
      whatsappStatus: filters?.whatsappStatus ?? null,
    };
  }

  private toResponse(segment: SegmentDocument): SegmentResponse {
    const normalizedFilters = this.normalizeFilters(segment.filters as SegmentFiltersDto);

    return {
      id: segment.id,
      workspaceId: segment.workspaceId.toString(),
      name: segment.name,
      description: segment.description,
      type: segment.type,
      filters: normalizedFilters,
      contactIds: segment.contactIds.map((contactId) => contactId.toString()),
      estimatedCount: segment.estimatedCount,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    };
  }

  private assertStaticSegment(type: SegmentType): void {
    if (type !== SegmentType.STATIC) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'MANUAL_CONTACTS_ONLY_FOR_STATIC_SEGMENTS',
        'Manual contact attachment is only supported for static segments',
      );
    }
  }

  private cleanString(value: string | undefined): string {
    return (value ?? '').trim();
  }

  private normalizeTag(tag: string): string {
    return this.cleanString(tag).toLowerCase();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_ID', 'Invalid ObjectId');
    }

    return new Types.ObjectId(id);
  }
}
