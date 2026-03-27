import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { TrackingTokenType } from './constants/tracking.enums';

interface TrackingTokenPayload {
  t: TrackingTokenType;
  cid: string;
  crid: string;
  ctid: string;
  u?: string;
  iat: number;
  exp: number;
  n: string;
}

interface TrackingTokenContext {
  campaignId: string;
  campaignRecipientId: string;
  contactId: string;
}

interface VerifyTrackingTokenResult {
  type: TrackingTokenType;
  campaignId: string;
  campaignRecipientId: string;
  contactId: string;
  url?: string;
}

@Injectable()
export class TrackingTokenService {
  private readonly tokenSecret: string;
  private readonly tokenTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.tokenSecret = this.configService.getOrThrow<string>('security.trackingTokenSecret', {
      infer: true,
    });
    this.tokenTtlSeconds =
      this.configService.get<number>('tracking.tokenTtlSeconds', {
        infer: true,
      }) ?? 60 * 60 * 24 * 30;
  }

  createOpenToken(context: TrackingTokenContext): string {
    return this.signPayload({
      t: TrackingTokenType.OPEN,
      cid: context.campaignId,
      crid: context.campaignRecipientId,
      ctid: context.contactId,
    });
  }

  createClickToken(context: TrackingTokenContext & { url: string }): string {
    return this.signPayload({
      t: TrackingTokenType.CLICK,
      cid: context.campaignId,
      crid: context.campaignRecipientId,
      ctid: context.contactId,
      u: context.url,
    });
  }

  verifyToken(token: string): VerifyTrackingTokenResult | null {
    const [encodedPayload, encodedSignature] = token.split('.');
    if (!encodedPayload || !encodedSignature) {
      return null;
    }

    const expectedSignature = this.signValue(encodedPayload);
    const provided = Buffer.from(encodedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    const payload = this.decodePayload(encodedPayload);
    if (!payload) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    if (!payload.cid || !payload.crid || !payload.ctid) {
      return null;
    }

    if (payload.t === TrackingTokenType.CLICK) {
      if (!payload.u || !this.isSafeUrl(payload.u)) {
        return null;
      }
    }

    return {
      type: payload.t,
      campaignId: payload.cid,
      campaignRecipientId: payload.crid,
      contactId: payload.ctid,
      ...(payload.u ? { url: payload.u } : {}),
    };
  }

  private signPayload(data: Omit<TrackingTokenPayload, 'iat' | 'exp' | 'n'>): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TrackingTokenPayload = {
      ...data,
      iat: now,
      exp: now + this.tokenTtlSeconds,
      n: randomBytes(8).toString('hex'),
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = this.signValue(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private signValue(value: string): string {
    return createHmac('sha256', this.tokenSecret).update(value).digest('base64url');
  }

  private decodePayload(encodedPayload: string): TrackingTokenPayload | null {
    try {
      const parsed = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as TrackingTokenPayload;

      if (parsed.t !== TrackingTokenType.OPEN && parsed.t !== TrackingTokenType.CLICK) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private isSafeUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
