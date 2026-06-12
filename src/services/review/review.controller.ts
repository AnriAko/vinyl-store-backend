import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    Query,
    Req,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import {
    ReviewService,
    ReviewWithLightUser,
} from '~/services/review/review.service';
import { CreateReviewDto } from '~/services/review/dto/create-review.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/entities/user.entity';
import { Public } from '~/common/decorators/public.decorator';
import { AuthRequest } from '~/types/auth-request';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @Post('/:vinylId')
    @ApiOperation({ summary: 'Create a review' })
    @ApiParam({ name: 'vinylId', type: String })
    @ApiBody({ type: CreateReviewDto })
    @ApiResponse({ status: 201 })
    async create(
        @Req() req: AuthRequest,
        @Param('vinylId') vinylId: string,
        @Body() dto: CreateReviewDto
    ): Promise<ReviewWithLightUser> {
        const userId = req.user.userId;
        return await this.reviewService.create({ ...dto, userId, vinylId });
    }

    @Public()
    @Get('/:vinylId')
    @ApiOperation({ summary: 'Get all reviews for a vinyl (paginated)' })
    @ApiParam({ name: 'vinylId', type: String })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiResponse({ status: 200 })
    async findAllByVinyl(
        @Param('vinylId') vinylId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
    ): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ReviewWithLightUser[];
    }> {
        return await this.reviewService.findAllByVinyl(vinylId, page, limit);
    }

    @Roles(UserRole.ADMIN)
    @Delete('/:vinylId/:userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete review by userId and vinylId',
    })
    @ApiParam({ name: 'userId', type: String, description: 'User ID' })
    @ApiParam({ name: 'vinylId', type: String, description: 'Vinyl ID' })
    async remove(
        @Param('userId') userId: string,
        @Param('vinylId') vinylId: string
    ): Promise<void> {
        await this.reviewService.removeByAdmin(userId, vinylId);
    }
}
