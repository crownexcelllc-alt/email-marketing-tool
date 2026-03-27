import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('whatsapp')
  async verifyWhatsappWebhook(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') verifyToken: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const verifiedChallenge = await this.webhooksService.verifyWhatsappWebhook({
      mode,
      verifyToken,
      challenge,
    });

    response.type('text/plain').status(200).send(verifiedChallenge);
  }

  @Post('whatsapp')
  @HttpCode(200)
  async handleWhatsappWebhook(@Body() payload: Record<string, unknown>): Promise<{
    received: boolean;
    eventsReceived: number;
    eventsProcessed: number;
    eventsIgnored: number;
  }> {
    const result = await this.webhooksService.handleWhatsappWebhook(payload);
    return {
      received: true,
      eventsReceived: result.eventsReceived,
      eventsProcessed: result.eventsProcessed,
      eventsIgnored: result.eventsIgnored,
    };
  }
}
