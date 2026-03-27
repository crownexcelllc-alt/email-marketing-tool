import { CampaignDistributionStrategy } from './constants/campaign.enums';

export interface DistributionRecipientInput {
  contactId: string;
  address: string;
}

export interface DistributionSenderInput {
  senderAccountId: string;
  dailyLimit: number;
  hourlyLimit: number;
}

export interface DistributionSenderCapacity extends DistributionSenderInput {
  maxAssignable: number;
}

export interface DistributionAssignment {
  senderAccountId: string;
  contactId: string;
  address: string;
}

export interface DistributionCapacity {
  totalDailyCapacity: number;
  totalHourlyCapacity: number;
  totalAssignable: number;
}

export interface DistributionResult {
  assignments: DistributionAssignment[];
  remainingRecipientCount: number;
  senderUsage: Record<string, number>;
}

export const normalizeSenderCapacities = (
  senders: DistributionSenderInput[],
): DistributionSenderCapacity[] => {
  return senders
    .map((sender) => {
      const daily = Math.max(0, Math.floor(sender.dailyLimit));
      const hourly = Math.max(0, Math.floor(sender.hourlyLimit));
      const maxAssignable = Math.min(daily, hourly);

      return {
        senderAccountId: sender.senderAccountId,
        dailyLimit: daily,
        hourlyLimit: hourly,
        maxAssignable,
      };
    })
    .filter((sender) => sender.maxAssignable > 0);
};

export const calculateDistributionCapacity = (
  senders: DistributionSenderCapacity[],
): DistributionCapacity => {
  const totalDailyCapacity = senders.reduce((sum, sender) => sum + sender.dailyLimit, 0);
  const totalHourlyCapacity = senders.reduce((sum, sender) => sum + sender.hourlyLimit, 0);
  const totalAssignable = senders.reduce((sum, sender) => sum + sender.maxAssignable, 0);

  return {
    totalDailyCapacity,
    totalHourlyCapacity,
    totalAssignable,
  };
};

export const distributeRecipients = (input: {
  strategy: CampaignDistributionStrategy;
  senders: DistributionSenderCapacity[];
  recipients: DistributionRecipientInput[];
}): DistributionResult => {
  if (!input.senders.length || !input.recipients.length) {
    return {
      assignments: [],
      remainingRecipientCount: input.recipients.length,
      senderUsage: {},
    };
  }

  if (input.strategy === CampaignDistributionStrategy.WEIGHTED_BY_DAILY_LIMIT) {
    return distributeWeightedByDailyLimit(input.senders, input.recipients);
  }

  return distributeRoundRobin(input.senders, input.recipients);
};

const distributeRoundRobin = (
  senders: DistributionSenderCapacity[],
  recipients: DistributionRecipientInput[],
): DistributionResult => {
  const assignments: DistributionAssignment[] = [];
  const remaining = new Map(
    senders.map((sender) => [sender.senderAccountId, sender.maxAssignable]),
  );
  const senderUsage: Record<string, number> = {};

  let senderIndex = 0;

  for (const recipient of recipients) {
    let assigned = false;
    let probes = 0;

    while (probes < senders.length) {
      const sender = senders[senderIndex];
      senderIndex = (senderIndex + 1) % senders.length;
      probes += 1;

      const senderRemaining = remaining.get(sender.senderAccountId) ?? 0;
      if (senderRemaining <= 0) {
        continue;
      }

      assignments.push({
        senderAccountId: sender.senderAccountId,
        contactId: recipient.contactId,
        address: recipient.address,
      });

      remaining.set(sender.senderAccountId, senderRemaining - 1);
      senderUsage[sender.senderAccountId] = (senderUsage[sender.senderAccountId] ?? 0) + 1;
      assigned = true;
      break;
    }

    if (!assigned) {
      break;
    }
  }

  return {
    assignments,
    remainingRecipientCount: recipients.length - assignments.length,
    senderUsage,
  };
};

const distributeWeightedByDailyLimit = (
  senders: DistributionSenderCapacity[],
  recipients: DistributionRecipientInput[],
): DistributionResult => {
  const assignments: DistributionAssignment[] = [];
  const remaining = new Map(
    senders.map((sender) => [sender.senderAccountId, sender.maxAssignable]),
  );
  const senderUsage: Record<string, number> = {};

  for (const recipient of recipients) {
    let bestSender: DistributionSenderCapacity | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const sender of senders) {
      const senderRemaining = remaining.get(sender.senderAccountId) ?? 0;
      if (senderRemaining <= 0) {
        continue;
      }

      const weight = Math.max(1, sender.dailyLimit);
      const assigned = senderUsage[sender.senderAccountId] ?? 0;
      const score = (assigned + 1) / weight;

      if (score < bestScore) {
        bestScore = score;
        bestSender = sender;
      }
    }

    if (!bestSender) {
      break;
    }

    assignments.push({
      senderAccountId: bestSender.senderAccountId,
      contactId: recipient.contactId,
      address: recipient.address,
    });

    remaining.set(bestSender.senderAccountId, (remaining.get(bestSender.senderAccountId) ?? 0) - 1);
    senderUsage[bestSender.senderAccountId] = (senderUsage[bestSender.senderAccountId] ?? 0) + 1;
  }

  return {
    assignments,
    remainingRecipientCount: recipients.length - assignments.length,
    senderUsage,
  };
};
