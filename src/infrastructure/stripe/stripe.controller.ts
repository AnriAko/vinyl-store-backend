import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiHeader,
} from '@nestjs/swagger';
import { StripeService } from '~/infrastructure/stripe/stripe.service';
import { Public } from '~/common/decorators/public.decorator';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) {}

    @Public()
    @Post('webhook')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Handle Stripe webhook events',
        description:
            'Processes incoming Stripe webhook events such as `payment_intent.succeeded`. This endpoint is called directly by Stripe and does not require authentication.',
    })
    @ApiHeader({
        name: 'stripe-signature',
        description:
            'The signature used by Stripe to verify the authenticity of the webhook event.',
        required: true,
    })
    @ApiBody({
        description: 'Raw binary payload sent by Stripe.',
        schema: {
            type: 'string',
            example: '<binary-data>',
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook processed successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid or failed webhook event processing.',
    })
    async handleWebhook(
        @Req() req: any,
        @Res() res: Response,
        @Headers('stripe-signature') sig: string
    ) {
        try {
            const payload = req.body;
            if (!payload || !Buffer.isBuffer(payload)) {
                throw new Error('No webhook payload was provided.');
            }

            await this.stripeService.handleWebhookEvent(payload, sig);
            res.send();
        } catch (err: any) {
            console.error('[Stripe webhook error]:', err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
}
