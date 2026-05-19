import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceSettings } from './schemas/workspace-settings.schema';

interface ChannelLimitsShape {
  dailyLimit?: number;
  hourlyLimit?: number;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
}

interface WorkspaceSettingsShape {
  profile: {
    fullName: string;
    email: string;
    timezone: string;
  };
  smtp: {
    defaultFromName: string;
    defaultFromEmail: string;
    replyToEmail: string;
    providerType: string;
    trackReplies: boolean;
  };
  whatsapp: {
    businessAccountId: string;
    phoneNumberId: string;
    webhookVerifyToken: string;
    defaultLanguage: string;
  };
  sendingLimits: {
    dailyLimit: number;
    hourlyLimit: number;
    minDelaySeconds: number;
    maxDelaySeconds: number;
    respectSenderLimits: boolean;
    email?: ChannelLimitsShape;
    sms?: ChannelLimitsShape;
    whatsapp?: ChannelLimitsShape;
  };
  tracking: {
    trackOpens: boolean;
    trackClicks: boolean;
    appendUtm: boolean;
    utmSource: string;
    utmMedium: string;
  };
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(WorkspaceSettings.name)
    private readonly settingsModel: Model<WorkspaceSettings>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getSettings(authUser: AuthUser): Promise<WorkspaceSettingsShape> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const record = await this.settingsModel
      .findOne({ workspaceId: this.toObjectId(workspaceId) })
      .lean()
      .exec();

    return this.normalizeSettings(record ?? null);
  }

  async updateSettings(
    patch: unknown,
    authUser: AuthUser,
  ): Promise<WorkspaceSettingsShape> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const workspaceObjectId = this.toObjectId(workspaceId);

    const existing = await this.settingsModel
      .findOne({ workspaceId: workspaceObjectId })
      .lean()
      .exec();

    const merged = this.applyPatch(this.normalizeSettings(existing ?? null), patch);

    const updated = await this.settingsModel
      .findOneAndUpdate(
        { workspaceId: workspaceObjectId },
        {
          $set: {
            profile: merged.profile,
            smtp: merged.smtp,
            whatsapp: merged.whatsapp,
            sendingLimits: merged.sendingLimits,
            tracking: merged.tracking,
          },
          $setOnInsert: {
            workspaceId: workspaceObjectId,
          },
        },
        { returnDocument: 'after', upsert: true },
      )
      .lean()
      .exec();

    return this.normalizeSettings(updated ?? null);
  }

  private normalizeSettings(input: unknown): WorkspaceSettingsShape {
    const record = this.asRecord(input);

    const profile = this.asRecord(record?.profile);
    const smtp = this.asRecord(record?.smtp);
    const whatsapp = this.asRecord(record?.whatsapp);
    const sendingLimits = this.asRecord(record?.sendingLimits);
    const tracking = this.asRecord(record?.tracking);

    return {
      profile: {
        fullName: this.readString(profile?.fullName, ''),
        email: this.readString(profile?.email, ''),
        timezone: this.readString(profile?.timezone, 'UTC'),
      },
      smtp: {
        defaultFromName: this.readString(smtp?.defaultFromName, ''),
        defaultFromEmail: this.readString(smtp?.defaultFromEmail, ''),
        replyToEmail: this.readString(smtp?.replyToEmail, ''),
        providerType: this.readString(smtp?.providerType, ''),
        trackReplies: this.readBoolean(smtp?.trackReplies, true),
      },
      whatsapp: {
        businessAccountId: this.readString(whatsapp?.businessAccountId, ''),
        phoneNumberId: this.readString(whatsapp?.phoneNumberId, ''),
        webhookVerifyToken: this.readString(whatsapp?.webhookVerifyToken, ''),
        defaultLanguage: this.readString(whatsapp?.defaultLanguage, 'en'),
      },
      sendingLimits: {
        dailyLimit: 5000,
        hourlyLimit: 500,
        minDelaySeconds: 15,
        maxDelaySeconds: 30,
        respectSenderLimits: this.readBoolean(sendingLimits?.respectSenderLimits, true),
        email: this.normalizeChannelLimits(sendingLimits?.email),
        sms: this.normalizeChannelLimits(sendingLimits?.sms),
        whatsapp: this.normalizeChannelLimits(sendingLimits?.whatsapp),
      },
      tracking: {
        trackOpens: this.readBoolean(tracking?.trackOpens, true),
        trackClicks: this.readBoolean(tracking?.trackClicks, true),
        appendUtm: this.readBoolean(tracking?.appendUtm, true),
        utmSource: this.readString(tracking?.utmSource, 'marketing-platform'),
        utmMedium: this.readString(tracking?.utmMedium, 'campaign'),
      },
    };
  }

  private applyPatch(current: WorkspaceSettingsShape, patch: unknown): WorkspaceSettingsShape {
    const input = this.asRecord(patch);
    if (!input) {
      return current;
    }

    const profile = this.asRecord(input.profile);
    const smtp = this.asRecord(input.smtp);
    const whatsapp = this.asRecord(input.whatsapp);
    const sendingLimits = this.asRecord(input.sendingLimits);
    const tracking = this.asRecord(input.tracking);

    return {
      profile: profile
        ? {
            fullName: this.readString(profile.fullName, current.profile.fullName),
            email: this.readString(profile.email, current.profile.email),
            timezone: this.readString(profile.timezone, current.profile.timezone),
          }
        : current.profile,
      smtp: smtp
        ? {
            defaultFromName: this.readString(smtp.defaultFromName, current.smtp.defaultFromName),
            defaultFromEmail: this.readString(
              smtp.defaultFromEmail,
              current.smtp.defaultFromEmail,
            ),
            replyToEmail: this.readString(smtp.replyToEmail, current.smtp.replyToEmail),
            providerType: this.readString(smtp.providerType, current.smtp.providerType),
            trackReplies: this.readBoolean(smtp.trackReplies, current.smtp.trackReplies),
          }
        : current.smtp,
      whatsapp: whatsapp
        ? {
            businessAccountId: this.readString(
              whatsapp.businessAccountId,
              current.whatsapp.businessAccountId,
            ),
            phoneNumberId: this.readString(whatsapp.phoneNumberId, current.whatsapp.phoneNumberId),
            webhookVerifyToken: this.readString(
              whatsapp.webhookVerifyToken,
              current.whatsapp.webhookVerifyToken,
            ),
            defaultLanguage: this.readString(
              whatsapp.defaultLanguage,
              current.whatsapp.defaultLanguage,
            ),
          }
        : current.whatsapp,
      sendingLimits: sendingLimits
        ? {
            dailyLimit: 5000,
            hourlyLimit: 500,
            minDelaySeconds: 15,
            maxDelaySeconds: 30,
            respectSenderLimits: this.readBoolean(
              sendingLimits.respectSenderLimits,
              current.sendingLimits.respectSenderLimits,
            ),
            email: this.hasProperty(sendingLimits, 'email')
              ? this.normalizeChannelLimits(sendingLimits.email)
              : current.sendingLimits.email,
            sms: this.hasProperty(sendingLimits, 'sms')
              ? this.normalizeChannelLimits(sendingLimits.sms)
              : current.sendingLimits.sms,
            whatsapp: this.hasProperty(sendingLimits, 'whatsapp')
              ? this.normalizeChannelLimits(sendingLimits.whatsapp)
              : current.sendingLimits.whatsapp,
          }
        : current.sendingLimits,
      tracking: tracking
        ? {
            trackOpens: this.readBoolean(tracking.trackOpens, current.tracking.trackOpens),
            trackClicks: this.readBoolean(tracking.trackClicks, current.tracking.trackClicks),
            appendUtm: this.readBoolean(tracking.appendUtm, current.tracking.appendUtm),
            utmSource: this.readString(tracking.utmSource, current.tracking.utmSource),
            utmMedium: this.readString(tracking.utmMedium, current.tracking.utmMedium),
          }
        : current.tracking,
    };
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

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return null;
  }

  private readString(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value.trim() : fallback;
  }

  private readBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return fallback;
  }

  private readNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return fallback;
  }

  private normalizeChannelLimits(input: unknown): ChannelLimitsShape | undefined {
    const record = this.asRecord(input);
    if (!record) {
      return undefined;
    }

    const dailyLimit = this.readOptionalNumber(record.dailyLimit);
    const hourlyLimit = this.readOptionalNumber(record.hourlyLimit);
    const minDelaySeconds = this.readOptionalNumber(record.minDelaySeconds);
    const maxDelaySeconds = this.readOptionalNumber(record.maxDelaySeconds);

    if (
      dailyLimit === undefined &&
      hourlyLimit === undefined &&
      minDelaySeconds === undefined &&
      maxDelaySeconds === undefined
    ) {
      return undefined;
    }

    return {
      dailyLimit,
      hourlyLimit,
      minDelaySeconds,
      maxDelaySeconds,
    };
  }

  private readOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return undefined;
  }

  private hasProperty(obj: Record<string, unknown>, prop: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
}

