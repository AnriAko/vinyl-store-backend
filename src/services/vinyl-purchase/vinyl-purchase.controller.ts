import { Controller, Post, Get, Req, Param } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { VinylPurchaseService } from '~/services/vinyl-purchase/vinyl-purchase.service';
import { AuthRequest } from '~/types/auth-request';

@ApiTags('Vinyl Purchases')
@ApiBearerAuth()
@Controller('vinyl/purchase')
export class VinylPurchaseController {
    constructor(private readonly vinylPurchaseService: VinylPurchaseService) {}

    @Post('checkout/:vinylId/:amount')
    @ApiOperation({
        summary: 'Create a new Stripe checkout session',
        description:
            'Creates a Stripe checkout session for purchasing a specific vinyl. Requires authentication.',
    })
    @ApiParam({
        name: 'vinylId',
        description: 'The ID of the vinyl record to purchase.',
        example: '9b22afc0-7d63-4b0a-98a1-8a1e79a4df15',
    })
    @ApiParam({
        name: 'amount',
        description: 'The quantity of vinyls to purchase.',
        example: '2',
    })
    @ApiResponse({
        status: 201,
        description: 'Checkout session created successfully.',
    })
    @ApiResponse({
        status: 400,
        description:
            'Invalid request parameters or Stripe session creation failed.',
    })
    async createCheckout(
        @Req() req: AuthRequest,
        @Param('vinylId') vinylId: string,
        @Param('amount') amount: string
    ) {
        const userId = req.user.userId;
        return this.vinylPurchaseService.createCheckout({
            userId,
            vinylId,
            amount: Number(amount),
        });
    }

    @Get()
    @ApiOperation({
        summary: 'Get all vinyl purchases for the authenticated user',
        description:
            'Returns a list of all vinyl purchases made by the currently authenticated user.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of vinyl purchases retrieved successfully.',
    })
    async getAllVinylPurchases(@Req() req: AuthRequest) {
        const userId = req.user.userId;
        return this.vinylPurchaseService.getAllVinylPurchasesByUser(userId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a specific vinyl purchase by ID',
        description:
            'Retrieves detailed information about a single vinyl purchase by its ID.',
    })
    @ApiParam({
        name: 'id',
        description: 'The ID of the vinyl purchase record.',
        example: 'c3b7e11e-2e1f-46a4-bb8a-3d7e6cb1b2f9',
    })
    @ApiResponse({
        status: 200,
        description: 'Vinyl purchase found and returned successfully.',
    })
    @ApiResponse({
        status: 404,
        description: 'Vinyl purchase not found.',
    })
    async getOneVinylPurchase(@Param('id') id: string) {
        return this.vinylPurchaseService.getOneVinylPurchaseById(id);
    }
}
