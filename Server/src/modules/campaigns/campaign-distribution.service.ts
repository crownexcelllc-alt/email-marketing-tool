import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { CampaignDistributionStrategy, CampaignStatus } from './constants/campaign.enums';
import {
  DistributionRecipientInput,
  DistributionResult,
  DistributionSenderInput,
  calculateDistributionCapacity,
  distributeRecipients,
  normalizeSenderCapacities,
} from './campaign-distribution.utils';

@Injectable()
export class CampaignDistributionService {
  validateCampaignCanStart(
    campaignStatus: CampaignStatus,
    recipientCount: number,
    senderInputs: DistributionSenderInput[],
  ): {
    totalDailyCapacity: number;
    totalHourlyCapacity: number;
    totalAssignable: number;
    normalizedSenders: ReturnType<typeof normalizeSenderCapacities>;
  } {
    if (
      campaignStatus === CampaignStatus.CANCELLED ||
      campaignStatus === CampaignStatus.COMPLETED
    ) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_NOT_STARTABLE',
        'Completed or cancelled campaigns cannot be started',
      );
    }

    const normalizedSenders = normalizeSenderCapacities(senderInputs);
    if (!normalizedSenders.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'NO_ACTIVE_SENDERS_WITH_CAPACITY',
        'No active sender accounts with available capacity',
      );
    }

    const capacity = calculateDistributionCapacity(normalizedSenders);

    if (recipientCount > capacity.totalAssignable) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INSUFFICIENT_SENDER_CAPACITY',
        'Total sender capacity is insufficient for campaign recipients',
        {
          recipientCount,
          totalDailyCapacity: capacity.totalDailyCapacity,
          totalHourlyCapacity: capacity.totalHourlyCapacity,
          totalAssignable: capacity.totalAssignable,
        },
      );
    }

    return {
      ...capacity,
      normalizedSenders,
    };
  }

  assignRecipients(
    strategy: CampaignDistributionStrategy,
    senderInputs: DistributionSenderInput[],
    recipients: DistributionRecipientInput[],
  ): DistributionResult {
    const normalizedSenders = normalizeSenderCapacities(senderInputs);
    return distributeRecipients({
      strategy,
      senders: normalizedSenders,
      recipients,
    });
  }
}
