import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  ContactEmailStatus,
  ContactSource,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from './constants/contact.enums';
import { BulkDeleteContactsDto } from './dto/bulk-delete-contacts.dto';
import { BulkTagUpdateDto } from './dto/bulk-tag-update.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { ContactsImportJobService } from './contacts-import-job.service';
import { ContactsImportService, ParsedContactCsvRow } from './contacts-import.service';
import {
  ContactImportResultResponse,
  ContactListResponse,
  ContactResponse,
} from './types/contact.response';

interface ContactWriteInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  company?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  emailStatus?: ContactEmailStatus;
  whatsappStatus?: ContactWhatsappStatus;
  subscriptionStatus?: ContactSubscriptionStatus;
  source?: ContactSource;
  notes?: string;
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly workspacesService: WorkspacesService,
    private readonly contactsImportService: ContactsImportService,
    private readonly contactsImportJobService: ContactsImportJobService,
  ) {}

  async create(dto: CreateContactDto, authUser: AuthUser): Promise<ContactResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const payload = this.buildContactPayload(dto);

    const created = await this.saveWithDuplicateHandling(
      new this.contactModel({
        workspaceId: this.toObjectId(workspaceId),
        ...payload,
      }),
    );

    return this.toResponse(created);
  }

  async findAll(query: ListContactsDto, authUser: AuthUser): Promise<ContactListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      workspaceId: this.toObjectId(workspaceId),
    };

    if (query.emailStatus) {
      filter.emailStatus = query.emailStatus;
    }
    if (query.whatsappStatus) {
      filter.whatsappStatus = query.whatsappStatus;
    }
    if (query.subscriptionStatus) {
      filter.subscriptionStatus = query.subscriptionStatus;
    }
    if (query.source) {
      filter.source = query.source;
    }
    if (query.tags?.length) {
      filter.tags = { $in: query.tags.map((tag) => this.normalizeTag(tag)) };
    }

    if (query.search) {
      const escaped = this.escapeRegex(query.search.trim());
      const searchRegex = new RegExp(escaped, 'i');

      filter.$or = [
        { fullName: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((item) => this.toResponse(item)),
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

  async findOne(id: string, authUser: AuthUser): Promise<ContactResponse> {
    const contact = await this.findOwnedContact(id, authUser);
    return this.toResponse(contact);
  }

  async update(id: string, dto: UpdateContactDto, authUser: AuthUser): Promise<ContactResponse> {
    const contact = await this.findOwnedContact(id, authUser);

    const merged = this.buildContactPayload({
      firstName: dto.firstName ?? contact.firstName,
      lastName: dto.lastName ?? contact.lastName,
      fullName: dto.fullName ?? contact.fullName,
      email: dto.email ?? contact.email,
      phone: dto.phone ?? contact.phone,
      company: dto.company ?? contact.company,
      tags: dto.tags ?? contact.tags,
      customFields: dto.customFields ?? contact.customFields,
      emailStatus: dto.emailStatus ?? contact.emailStatus,
      whatsappStatus: dto.whatsappStatus ?? contact.whatsappStatus,
      subscriptionStatus: dto.subscriptionStatus ?? contact.subscriptionStatus,
      source: dto.source ?? contact.source,
      notes: dto.notes ?? contact.notes,
    });

    contact.firstName = merged.firstName;
    contact.lastName = merged.lastName;
    contact.fullName = merged.fullName;
    contact.email = merged.email;
    contact.phone = merged.phone;
    contact.emailNormalized = merged.emailNormalized;
    contact.phoneNormalized = merged.phoneNormalized;
    contact.company = merged.company;
    contact.tags = merged.tags;
    contact.customFields = merged.customFields;
    contact.emailStatus = merged.emailStatus;
    contact.whatsappStatus = merged.whatsappStatus;
    contact.subscriptionStatus = merged.subscriptionStatus;
    contact.source = merged.source;
    contact.notes = merged.notes;

    const saved = await this.saveWithDuplicateHandling(contact);
    return this.toResponse(saved);
  }

  async remove(id: string, authUser: AuthUser): Promise<{ deleted: true; id: string }> {
    const contact = await this.findOwnedContact(id, authUser);
    await this.contactModel.deleteOne({ _id: contact._id }).exec();

    return {
      deleted: true,
      id,
    };
  }

  async bulkDelete(
    dto: BulkDeleteContactsDto,
    authUser: AuthUser,
  ): Promise<{ requested: number; deleted: number }> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const ids = dto.ids.map((id) => this.toObjectId(id));

    const result = await this.contactModel
      .deleteMany({
        workspaceId: this.toObjectId(workspaceId),
        _id: { $in: ids },
      })
      .exec();

    return {
      requested: dto.ids.length,
      deleted: result.deletedCount ?? 0,
    };
  }

  async bulkTagUpdate(
    dto: BulkTagUpdateDto,
    authUser: AuthUser,
  ): Promise<{ requested: number; modified: number }> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const addTags = this.normalizeTags(dto.addTags ?? []);
    const removeTags = this.normalizeTags(dto.removeTags ?? []);
    const setTags = dto.setTags ? this.normalizeTags(dto.setTags) : undefined;

    if (!setTags && !addTags.length && !removeTags.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'BULK_TAG_ACTION_REQUIRED',
        'At least one of setTags, addTags, or removeTags is required',
      );
    }

    const filter = {
      workspaceId: this.toObjectId(workspaceId),
      _id: { $in: dto.ids.map((id) => this.toObjectId(id)) },
    };

    let result;

    if (setTags) {
      result = await this.contactModel.updateMany(filter, { $set: { tags: setTags } }).exec();
    } else {
      const update: Record<string, unknown> = {};

      if (addTags.length) {
        update.$addToSet = { tags: { $each: addTags } };
      }

      if (removeTags.length) {
        update.$pull = { tags: { $in: removeTags } };
      }

      result = await this.contactModel.updateMany(filter, update).exec();
    }

    return {
      requested: dto.ids.length,
      modified: result.modifiedCount,
    };
  }

  async importCsv(
    file: Express.Multer.File | undefined,
    dto: ImportContactsDto,
    authUser: AuthUser,
  ): Promise<ContactImportResultResponse> {
    if (!file?.buffer?.length) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'CSV_FILE_REQUIRED', 'CSV file is required');
    }

    const workspaceId = await this.resolveWorkspaceId(authUser);

    const source = dto.source ?? ContactSource.CSV_IMPORT;
    const parsed = this.contactsImportService.parseCsv(file.buffer, source);

    if (dto.queueOnly) {
      const queuedJob = await this.contactsImportJobService.enqueueImportJob(
        workspaceId,
        file.originalname,
      );

      return {
        created: 0,
        skipped: 0,
        invalid: 0,
        total: parsed.total,
        queuedJob,
      };
    }

    let created = 0;
    let skipped = 0;
    let invalid = 0;
    const invalidRows: Array<{ row: number; reason: string }> = [];

    for (const row of parsed.rows) {
      try {
        const result = await this.createFromImportRow(workspaceId, row);
        if (result === 'created') {
          created += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        if (error instanceof AppException && this.isDuplicateContactException(error)) {
          skipped += 1;
          continue;
        }

        invalid += 1;
        invalidRows.push({
          row: row.rowNumber,
          reason: error instanceof Error ? error.message : 'Invalid row',
        });
      }
    }

    return {
      created,
      skipped,
      invalid,
      total: parsed.total,
      invalidRows,
    };
  }

  private async createFromImportRow(
    workspaceId: string,
    row: ParsedContactCsvRow,
  ): Promise<'created' | 'skipped'> {
    const payload = this.buildContactPayload({
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      company: row.company,
      tags: row.tags,
      customFields: row.customFields,
      notes: row.notes,
      source: row.source,
      emailStatus: ContactEmailStatus.UNKNOWN,
      whatsappStatus: ContactWhatsappStatus.UNKNOWN,
      subscriptionStatus: ContactSubscriptionStatus.SUBSCRIBED,
    });

    const duplicateFilter: Record<string, unknown>[] = [];
    if (payload.emailNormalized) {
      duplicateFilter.push({ emailNormalized: payload.emailNormalized });
    }
    if (payload.phoneNormalized) {
      duplicateFilter.push({ phoneNormalized: payload.phoneNormalized });
    }

    if (!duplicateFilter.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CONTACT_METHOD_REQUIRED',
        'Each imported row must contain email or phone',
      );
    }

    const existing = await this.contactModel
      .findOne({
        workspaceId: this.toObjectId(workspaceId),
        $or: duplicateFilter,
      })
      .select('_id')
      .lean()
      .exec();

    if (existing) {
      return 'skipped';
    }

    await this.saveWithDuplicateHandling(
      new this.contactModel({
        workspaceId: this.toObjectId(workspaceId),
        ...payload,
      }),
      true,
    );

    return 'created';
  }

  private buildContactPayload(input: ContactWriteInput): {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    emailNormalized: string | null;
    phoneNormalized: string | null;
    company: string;
    tags: string[];
    customFields: Record<string, unknown>;
    emailStatus: ContactEmailStatus;
    whatsappStatus: ContactWhatsappStatus;
    subscriptionStatus: ContactSubscriptionStatus;
    source: ContactSource;
    notes: string;
  } {
    const firstName = this.cleanString(input.firstName);
    const lastName = this.cleanString(input.lastName);

    const fullName =
      this.cleanString(input.fullName) ||
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      this.cleanString(input.email) ||
      this.cleanString(input.phone);

    const email = this.normalizeEmail(input.email);
    const phone = this.normalizePhone(input.phone);

    if (!email && !phone) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CONTACT_METHOD_REQUIRED',
        'At least one contact method (email or phone) is required',
      );
    }

    if (!fullName) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'FULL_NAME_REQUIRED',
        'fullName could not be resolved',
      );
    }

    return {
      firstName,
      lastName,
      fullName,
      email,
      phone,
      emailNormalized: email,
      phoneNormalized: phone,
      company: this.cleanString(input.company),
      tags: this.normalizeTags(input.tags ?? []),
      customFields: this.normalizeCustomFields(input.customFields),
      emailStatus: input.emailStatus ?? ContactEmailStatus.UNKNOWN,
      whatsappStatus: input.whatsappStatus ?? ContactWhatsappStatus.UNKNOWN,
      subscriptionStatus: input.subscriptionStatus ?? ContactSubscriptionStatus.SUBSCRIBED,
      source: input.source ?? ContactSource.MANUAL,
      notes: this.cleanString(input.notes),
    };
  }

  private toResponse(contact: ContactDocument): ContactResponse {
    return {
      id: contact.id,
      workspaceId: contact.workspaceId.toString(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      tags: [...contact.tags],
      customFields: this.normalizeCustomFields(contact.customFields),
      emailStatus: contact.emailStatus,
      whatsappStatus: contact.whatsappStatus,
      subscriptionStatus: contact.subscriptionStatus,
      source: contact.source,
      notes: contact.notes,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  private async findOwnedContact(id: string, authUser: AuthUser): Promise<ContactDocument> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const contact = await this.contactModel
      .findOne({
        _id: this.toObjectId(id),
        workspaceId: this.toObjectId(workspaceId),
      })
      .exec();

    if (!contact) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CONTACT_NOT_FOUND', 'Contact not found');
    }

    return contact;
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

  private async saveWithDuplicateHandling(
    contact: ContactDocument,
    allowSilentDuplicateSkip = false,
  ): Promise<ContactDocument> {
    try {
      return await contact.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        if (allowSilentDuplicateSkip) {
          throw new AppException(
            HttpStatus.CONFLICT,
            'DUPLICATE_CONTACT',
            'Duplicate contact in workspace',
          );
        }

        throw new AppException(
          HttpStatus.CONFLICT,
          'DUPLICATE_CONTACT',
          'Contact with same email or phone already exists in workspace',
        );
      }

      throw error;
    }
  }

  private normalizeEmail(email?: string | null): string | null {
    const value = this.cleanString(email);
    return value ? value.toLowerCase() : null;
  }

  private normalizePhone(phone?: string | null): string | null {
    const value = this.cleanString(phone);
    if (!value) {
      return null;
    }

    let normalized = value.replace(/[^\d+]/g, '');
    if (normalized.startsWith('+')) {
      normalized = `+${normalized.slice(1).replace(/\+/g, '')}`;
    } else {
      normalized = normalized.replace(/\+/g, '');
    }

    return normalized || null;
  }

  private normalizeTags(tags: string[]): string[] {
    const normalized = tags.map((tag) => this.normalizeTag(tag)).filter(Boolean);

    return Array.from(new Set(normalized));
  }

  private normalizeTag(tag: string): string {
    return this.cleanString(tag).toLowerCase();
  }

  private normalizeCustomFields(
    customFields: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (!customFields || Array.isArray(customFields) || typeof customFields !== 'object') {
      return {};
    }

    return customFields;
  }

  private cleanString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim();
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

  private isDuplicateContactException(exception: AppException): boolean {
    const response = exception.getResponse() as { code?: string };
    return response.code === 'DUPLICATE_CONTACT';
  }
}
