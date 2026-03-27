import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { Contact } from '../contacts/schemas/contact.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { TemplateChannelType, TemplateStatus } from './constants/template.enums';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { PreviewTemplateDto } from './dto/preview-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template, TemplateDocument } from './schemas/template.schema';
import { TemplatesPreviewService } from './templates-preview.service';
import { TemplatesVariableService } from './templates-variable.service';
import {
  TemplateListResponse,
  TemplatePreviewResponse,
  TemplateResponse,
} from './types/template.response';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<Template>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly workspacesService: WorkspacesService,
    private readonly variableService: TemplatesVariableService,
    private readonly previewService: TemplatesPreviewService,
  ) {}

  async create(dto: CreateTemplateDto, authUser: AuthUser): Promise<TemplateResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const template = new this.templateModel({
      workspaceId: this.toObjectId(workspaceId),
      name: dto.name.trim(),
      channelType: dto.channelType,
      category: dto.category,
      status: dto.status ?? TemplateStatus.DRAFT,
      variables: this.buildVariables(dto, undefined),
      email: null,
      whatsapp: null,
    });

    if (dto.channelType === TemplateChannelType.EMAIL) {
      this.assertEmailCreatePayload(dto);
      template.email = {
        subject: dto.subject as string,
        previewText: dto.previewText ?? '',
        htmlBody: dto.htmlBody as string,
        textBody: dto.textBody ?? '',
      };
    } else {
      this.assertWhatsAppCreatePayload(dto);
      template.whatsapp = {
        templateName: dto.templateName as string,
        language: dto.language as string,
        bodyParams: dto.bodyParams ?? [],
        headerParams: dto.headerParams ?? [],
        buttonParams: dto.buttonParams ?? [],
      };
    }

    const saved = await this.saveWithDuplicateHandling(template);
    return this.toResponse(saved);
  }

  async findAll(query: ListTemplatesDto, authUser: AuthUser): Promise<TemplateListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, unknown> = {
      workspaceId: this.toObjectId(workspaceId),
    };

    if (query.channelType) {
      filter.channelType = query.channelType;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      filter.name = new RegExp(this.escapeRegex(query.search.trim()), 'i');
    }

    const [templates, total] = await Promise.all([
      this.templateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.templateModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: templates.map((template) => this.toResponse(template)),
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

  async findOne(id: string, authUser: AuthUser): Promise<TemplateResponse> {
    const template = await this.findOwnedTemplate(id, authUser);
    return this.toResponse(template);
  }

  async update(id: string, dto: UpdateTemplateDto, authUser: AuthUser): Promise<TemplateResponse> {
    const template = await this.findOwnedTemplate(id, authUser);

    if (dto.name !== undefined) {
      template.name = dto.name.trim();
    }

    if (dto.category !== undefined) {
      template.category = dto.category;
    }

    if (dto.status !== undefined) {
      template.status = dto.status;
    }

    if (template.channelType === TemplateChannelType.EMAIL) {
      this.assertNoWhatsAppFieldsInEmailUpdate(dto);

      if (!template.email) {
        throw new AppException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'EMAIL_TEMPLATE_CONTENT_MISSING',
          'Email template content is missing',
        );
      }

      if (dto.subject !== undefined) {
        template.email.subject = dto.subject;
      }
      if (dto.previewText !== undefined) {
        template.email.previewText = dto.previewText;
      }
      if (dto.htmlBody !== undefined) {
        template.email.htmlBody = dto.htmlBody;
      }
      if (dto.textBody !== undefined) {
        template.email.textBody = dto.textBody;
      }
    }

    if (template.channelType === TemplateChannelType.WHATSAPP) {
      this.assertNoEmailFieldsInWhatsAppUpdate(dto);

      if (!template.whatsapp) {
        throw new AppException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'WHATSAPP_TEMPLATE_CONTENT_MISSING',
          'WhatsApp template content is missing',
        );
      }

      if (dto.templateName !== undefined) {
        template.whatsapp.templateName = dto.templateName;
      }
      if (dto.language !== undefined) {
        template.whatsapp.language = dto.language;
      }
      if (dto.bodyParams !== undefined) {
        template.whatsapp.bodyParams = dto.bodyParams;
      }
      if (dto.headerParams !== undefined) {
        template.whatsapp.headerParams = dto.headerParams;
      }
      if (dto.buttonParams !== undefined) {
        template.whatsapp.buttonParams = dto.buttonParams;
      }
    }

    template.variables = this.buildVariables(dto, template);

    const saved = await this.saveWithDuplicateHandling(template);
    return this.toResponse(saved);
  }

  async remove(id: string, authUser: AuthUser): Promise<{ deleted: true; id: string }> {
    const template = await this.findOwnedTemplate(id, authUser);
    await this.templateModel.deleteOne({ _id: template._id }).exec();

    return {
      deleted: true,
      id,
    };
  }

  async preview(
    id: string,
    dto: PreviewTemplateDto,
    authUser: AuthUser,
  ): Promise<TemplatePreviewResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const template = await this.findOwnedTemplate(id, authUser);

    const sampleData = await this.resolveSampleData(workspaceId, dto);

    return this.previewService.renderTemplate(template, sampleData);
  }

  private async resolveSampleData(
    workspaceId: string,
    dto: PreviewTemplateDto,
  ): Promise<Record<string, unknown>> {
    const defaultSample: Record<string, unknown> = {
      firstName: 'Alex',
      lastName: 'Johnson',
      fullName: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '+15550001111',
      company: 'Acme Inc',
      tags: ['vip', 'beta'],
      customFields: {
        city: 'Lahore',
        plan: 'pro',
      },
    };

    let contactSample: Record<string, unknown> = {};

    if (dto.contactId) {
      const contact = await this.contactModel
        .findOne({
          _id: this.toObjectId(dto.contactId),
          workspaceId: this.toObjectId(workspaceId),
        })
        .lean()
        .exec();

      if (!contact) {
        throw new AppException(HttpStatus.NOT_FOUND, 'CONTACT_NOT_FOUND', 'Contact not found');
      }

      contactSample = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        tags: contact.tags,
        customFields: contact.customFields,
      };
    }

    const requestSample = dto.sampleContact
      ? {
          firstName: dto.sampleContact.firstName,
          lastName: dto.sampleContact.lastName,
          fullName: dto.sampleContact.fullName,
          email: dto.sampleContact.email,
          phone: dto.sampleContact.phone,
          company: dto.sampleContact.company,
          customFields: dto.sampleContact.customFields,
        }
      : {};

    const merged = {
      ...defaultSample,
      ...contactSample,
      ...requestSample,
    } as Record<string, unknown>;

    if (!merged.fullName) {
      const firstName = typeof merged.firstName === 'string' ? merged.firstName.trim() : '';
      const lastName = typeof merged.lastName === 'string' ? merged.lastName.trim() : '';
      merged.fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    return merged;
  }

  private buildVariables(
    dto: Pick<
      CreateTemplateDto | UpdateTemplateDto,
      | 'variables'
      | 'subject'
      | 'previewText'
      | 'htmlBody'
      | 'textBody'
      | 'templateName'
      | 'language'
      | 'bodyParams'
      | 'headerParams'
      | 'buttonParams'
    >,
    existingTemplate: TemplateDocument | undefined,
  ): string[] {
    let extracted: string[] = [];

    if (existingTemplate?.channelType === TemplateChannelType.EMAIL || dto.subject !== undefined) {
      const subject = dto.subject ?? existingTemplate?.email?.subject;
      const previewText = dto.previewText ?? existingTemplate?.email?.previewText;
      const htmlBody = dto.htmlBody ?? existingTemplate?.email?.htmlBody;
      const textBody = dto.textBody ?? existingTemplate?.email?.textBody;

      extracted = this.variableService.extractVariablesFromTexts([
        subject,
        previewText,
        htmlBody,
        textBody,
      ]);
    }

    if (
      existingTemplate?.channelType === TemplateChannelType.WHATSAPP ||
      dto.templateName !== undefined ||
      dto.bodyParams !== undefined ||
      dto.headerParams !== undefined ||
      dto.buttonParams !== undefined
    ) {
      const templateName = dto.templateName ?? existingTemplate?.whatsapp?.templateName;
      const language = dto.language ?? existingTemplate?.whatsapp?.language;
      const bodyParams = dto.bodyParams ?? existingTemplate?.whatsapp?.bodyParams ?? [];
      const headerParams = dto.headerParams ?? existingTemplate?.whatsapp?.headerParams ?? [];
      const buttonParams = dto.buttonParams ?? existingTemplate?.whatsapp?.buttonParams ?? [];

      extracted = this.variableService.extractVariablesFromTexts([
        templateName,
        language,
        ...bodyParams,
        ...headerParams,
        ...buttonParams,
      ]);
    }

    const explicitVariables = dto.variables ?? existingTemplate?.variables ?? [];
    return this.variableService.mergeVariables(explicitVariables, extracted);
  }

  private assertEmailCreatePayload(dto: CreateTemplateDto): void {
    const missingFields: string[] = [];

    if (!dto.subject) {
      missingFields.push('subject');
    }

    if (!dto.htmlBody) {
      missingFields.push('htmlBody');
    }

    if (missingFields.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_TEMPLATE_FIELDS_REQUIRED',
        `Missing required email template fields: ${missingFields.join(', ')}`,
      );
    }
  }

  private assertWhatsAppCreatePayload(dto: CreateTemplateDto): void {
    const missingFields: string[] = [];

    if (!dto.templateName) {
      missingFields.push('templateName');
    }

    if (!dto.language) {
      missingFields.push('language');
    }

    if (missingFields.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'WHATSAPP_TEMPLATE_FIELDS_REQUIRED',
        `Missing required WhatsApp template fields: ${missingFields.join(', ')}`,
      );
    }
  }

  private assertNoWhatsAppFieldsInEmailUpdate(dto: UpdateTemplateDto): void {
    const invalidFields: Array<keyof UpdateTemplateDto> = [
      'templateName',
      'language',
      'bodyParams',
      'headerParams',
      'buttonParams',
    ];

    const provided = invalidFields.filter((field) => dto[field] !== undefined);

    if (provided.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_WHATSAPP_FIELDS_FOR_EMAIL_TEMPLATE',
        `Cannot update WhatsApp fields on email template: ${provided.join(', ')}`,
      );
    }
  }

  private assertNoEmailFieldsInWhatsAppUpdate(dto: UpdateTemplateDto): void {
    const invalidFields: Array<keyof UpdateTemplateDto> = [
      'subject',
      'previewText',
      'htmlBody',
      'textBody',
    ];

    const provided = invalidFields.filter((field) => dto[field] !== undefined);

    if (provided.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_EMAIL_FIELDS_FOR_WHATSAPP_TEMPLATE',
        `Cannot update email fields on WhatsApp template: ${provided.join(', ')}`,
      );
    }
  }

  private async findOwnedTemplate(id: string, authUser: AuthUser): Promise<TemplateDocument> {
    const workspaceId = await this.resolveWorkspaceId(authUser);

    const template = await this.templateModel
      .findOne({
        _id: this.toObjectId(id),
        workspaceId: this.toObjectId(workspaceId),
      })
      .exec();

    if (!template) {
      throw new AppException(HttpStatus.NOT_FOUND, 'TEMPLATE_NOT_FOUND', 'Template not found');
    }

    return template;
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

  private toResponse(template: TemplateDocument): TemplateResponse {
    const base = {
      id: template.id,
      workspaceId: template.workspaceId.toString(),
      channelType: template.channelType,
      name: template.name,
      category: template.category,
      status: template.status,
      variables: [...template.variables],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    if (template.channelType === TemplateChannelType.EMAIL && template.email) {
      return {
        ...base,
        channelType: TemplateChannelType.EMAIL,
        subject: template.email.subject,
        previewText: template.email.previewText,
        htmlBody: template.email.htmlBody,
        textBody: template.email.textBody,
      };
    }

    if (template.channelType === TemplateChannelType.WHATSAPP && template.whatsapp) {
      return {
        ...base,
        channelType: TemplateChannelType.WHATSAPP,
        templateName: template.whatsapp.templateName,
        language: template.whatsapp.language,
        bodyParams: [...template.whatsapp.bodyParams],
        headerParams: [...template.whatsapp.headerParams],
        buttonParams: [...template.whatsapp.buttonParams],
      };
    }

    throw new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INVALID_TEMPLATE_STATE',
      'Template content does not match channel type',
    );
  }

  private async saveWithDuplicateHandling(template: TemplateDocument): Promise<TemplateDocument> {
    try {
      return await template.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'TEMPLATE_ALREADY_EXISTS',
          'A template with this name already exists for this workspace and channel',
        );
      }

      throw error;
    }
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
