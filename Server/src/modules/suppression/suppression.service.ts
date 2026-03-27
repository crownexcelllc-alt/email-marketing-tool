import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { Contact } from '../contacts/schemas/contact.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  SuppressionChannel,
  SuppressionReason,
  SuppressionSource,
} from './constants/suppression.enums';
import { CreateSuppressionDto } from './dto/create-suppression.dto';
import { ListSuppressionDto } from './dto/list-suppression.dto';
import { Suppression, SuppressionDocument } from './schemas/suppression.schema';
import {
  SuppressionCheckContactInput,
  SuppressionCheckResult,
  SuppressionResponse,
} from './types/suppression.response';

@Injectable()
export class SuppressionService {
  constructor(
    @InjectModel(Suppression.name)
    private readonly suppressionModel: Model<Suppression>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async create(dto: CreateSuppressionDto, authUser: AuthUser): Promise<SuppressionResponse> {
    const workspaceId = await this.resolveWorkspaceIdFromAuth(authUser);
    const workspaceObjectId = this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID');

    const contactId = dto.contactId ? this.toObjectId(dto.contactId, 'INVALID_CONTACT_ID') : null;
    const contact = contactId
      ? await this.findWorkspaceContact(workspaceObjectId, contactId)
      : null;

    const rawAddress = this.resolveCreateAddress(dto.channel, dto.address, contact);
    const addressNormalized = this.normalizeAddress(dto.channel, rawAddress);
    this.assertValidAddress(dto.channel, addressNormalized);

    const createdBy = this.toObjectId(authUser.sub, 'INVALID_AUTH_USER');

    const suppression = new this.suppressionModel({
      workspaceId: workspaceObjectId,
      contactId,
      channel: dto.channel,
      address: addressNormalized,
      addressNormalized,
      reason: dto.reason,
      source: dto.source ?? SuppressionSource.MANUAL,
      createdBy,
    });

    const saved = await this.saveWithDuplicateHandling(suppression);
    return this.toResponse(saved);
  }

  async findAll(query: ListSuppressionDto, authUser: AuthUser): Promise<SuppressionResponse[]> {
    const workspaceId = await this.resolveWorkspaceIdFromAuth(authUser);
    const filter: Record<string, unknown> = {
      workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
    };

    if (query.channel) {
      filter.channel = query.channel;
    }

    if (query.reason) {
      filter.reason = query.reason;
    }

    if (query.source) {
      filter.source = query.source;
    }

    if (query.contactId) {
      filter.contactId = this.toObjectId(query.contactId, 'INVALID_CONTACT_ID');
    }

    if (query.address?.trim()) {
      if (query.channel) {
        filter.addressNormalized = this.normalizeAddress(query.channel, query.address);
      } else {
        filter.address = new RegExp(this.escapeRegex(query.address.trim()), 'i');
      }
    }

    const suppressions = await this.suppressionModel.find(filter).sort({ createdAt: -1 }).exec();
    return suppressions.map((suppression) => this.toResponse(suppression));
  }

  async remove(id: string, authUser: AuthUser): Promise<{ deleted: true; id: string }> {
    const workspaceId = await this.resolveWorkspaceIdFromAuth(authUser);

    const suppression = await this.suppressionModel
      .findOne({
        _id: this.toObjectId(id, 'INVALID_SUPPRESSION_ID'),
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
      })
      .exec();

    if (!suppression) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'SUPPRESSION_NOT_FOUND',
        'Suppression record not found',
      );
    }

    await this.suppressionModel.deleteOne({ _id: suppression._id }).exec();

    return {
      deleted: true,
      id,
    };
  }

  async checkSuppression(
    workspaceId: string,
    channel: SuppressionChannel,
    contact: SuppressionCheckContactInput,
  ): Promise<SuppressionCheckResult> {
    const workspaceObjectId = this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID');

    const contactId = this.extractContactId(contact);
    const address = this.resolveContactAddressForChannel(channel, contact);

    const matchClauses: Array<{ type: 'contactId' | 'address'; query: Record<string, unknown> }> =
      [];

    if (contactId) {
      matchClauses.push({
        type: 'contactId',
        query: { contactId },
      });
    }

    if (address) {
      const normalized = this.normalizeAddress(channel, address);
      if (normalized) {
        matchClauses.push({
          type: 'address',
          query: { addressNormalized: normalized },
        });
      }
    }

    if (!matchClauses.length) {
      return { suppressed: false };
    }

    const suppression = await this.suppressionModel
      .findOne({
        workspaceId: workspaceObjectId,
        channel,
        $or: matchClauses.map((clause) => clause.query),
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!suppression) {
      return { suppressed: false };
    }

    const matchType =
      contactId && suppression.contactId?.toString() === contactId.toString()
        ? 'contactId'
        : 'address';

    return {
      suppressed: true,
      matchType,
      suppression: this.toResponse(suppression),
    };
  }

  private async findWorkspaceContact(
    workspaceId: Types.ObjectId,
    contactId: Types.ObjectId,
  ): Promise<{
    _id: Types.ObjectId;
    email: string | null;
    phone: string | null;
  }> {
    const contact = await this.contactModel
      .findOne({
        _id: contactId,
        workspaceId,
      })
      .select('_id email phone')
      .lean()
      .exec();

    if (!contact) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CONTACT_NOT_FOUND', 'Contact not found');
    }

    return {
      _id: contact._id,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
    };
  }

  private resolveCreateAddress(
    channel: SuppressionChannel,
    providedAddress: string | undefined,
    contact: { email: string | null; phone: string | null } | null,
  ): string {
    const cleanProvided = providedAddress?.trim() ?? '';
    if (cleanProvided) {
      return cleanProvided;
    }

    if (contact) {
      const fromContact =
        channel === SuppressionChannel.EMAIL ? (contact.email ?? '') : (contact.phone ?? '');

      if (fromContact.trim()) {
        return fromContact.trim();
      }
    }

    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'SUPPRESSION_ADDRESS_REQUIRED',
      'Address is required or must be derivable from contact for selected channel',
    );
  }

  private resolveContactAddressForChannel(
    channel: SuppressionChannel,
    contact: SuppressionCheckContactInput,
  ): string {
    if (channel === SuppressionChannel.EMAIL) {
      return (contact.email ?? '').trim();
    }

    return (contact.phone ?? '').trim();
  }

  private extractContactId(contact: SuppressionCheckContactInput): Types.ObjectId | null {
    const candidate = contact.contactId ?? contact.id ?? contact._id;
    if (!candidate) {
      return null;
    }

    return this.toObjectId(candidate, 'INVALID_CONTACT_ID');
  }

  private normalizeAddress(channel: SuppressionChannel, address: string): string {
    const value = address.trim();
    if (!value) {
      return '';
    }

    if (channel === SuppressionChannel.EMAIL) {
      return value.toLowerCase();
    }

    let normalized = value.replace(/[^\d+]/g, '');
    if (normalized.startsWith('+')) {
      normalized = `+${normalized.slice(1).replace(/\+/g, '')}`;
    } else {
      normalized = normalized.replace(/\+/g, '');
    }

    return normalized;
  }

  private assertValidAddress(channel: SuppressionChannel, normalizedAddress: string): void {
    if (!normalizedAddress) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SUPPRESSION_ADDRESS_REQUIRED',
        'Address is required',
      );
    }

    if (channel === SuppressionChannel.EMAIL) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedAddress);
      if (!isEmail) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          'INVALID_EMAIL_ADDRESS',
          'Invalid email address for email suppression',
        );
      }
      return;
    }

    const isPhone = /^\+?\d{6,20}$/.test(normalizedAddress);
    if (!isPhone) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_PHONE_NUMBER',
        'Invalid phone number for WhatsApp suppression',
      );
    }
  }

  private async resolveWorkspaceIdFromAuth(authUser: AuthUser): Promise<string> {
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
    suppression: SuppressionDocument,
  ): Promise<SuppressionDocument> {
    try {
      return await suppression.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'SUPPRESSION_ALREADY_EXISTS',
          'Suppression entry already exists for this workspace/channel target',
        );
      }

      throw error;
    }
  }

  private toResponse(suppression: SuppressionDocument): SuppressionResponse {
    return {
      id: suppression.id,
      workspaceId: suppression.workspaceId.toString(),
      contactId: suppression.contactId ? suppression.contactId.toString() : null,
      channel: suppression.channel,
      address: suppression.address,
      reason: suppression.reason as SuppressionReason,
      source: suppression.source as SuppressionSource,
      createdBy: suppression.createdBy.toString(),
      createdAt: suppression.createdAt,
      updatedAt: suppression.updatedAt,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toObjectId(id: string, code: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, code, 'Invalid ObjectId');
    }

    return new Types.ObjectId(id);
  }
}
