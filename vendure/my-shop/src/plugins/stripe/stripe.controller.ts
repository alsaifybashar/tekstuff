import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) {}

    @Post('webhook')
    @HttpCode(200)
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string
    ) {
        try {
            const event = await this.stripeService.handleWebhook(req, signature);
            // Optionally, handle the event type here
            res.json({ received: true });
        } catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
}