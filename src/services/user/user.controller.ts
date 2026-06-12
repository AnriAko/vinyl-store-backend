import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Req,
    UseGuards,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '~/services/user/user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserInfoResponse } from '~/services/user/dto/user-info-response.dto';
import { AuthRequest } from '~/types/auth-request';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthGuard('access-jwt'))
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @ApiOperation({ summary: 'Get the authenticated user profile' })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved user profile',
        type: UserInfoResponse,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getProfile(@Req() req: AuthRequest): Promise<UserInfoResponse> {
        const userId = req.user.userId;
        return await this.userService.findOneDetailed(userId);
    }

    @Patch()
    @ApiOperation({ summary: 'Update the authenticated user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile successfully updated',
        type: UserInfoResponse,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async updateProfile(
        @Req() req: AuthRequest,
        @Body() dto: UpdateUserDto
    ): Promise<UserInfoResponse> {
        const userId = req.user.userId;
        return this.userService.update(userId, dto);
    }

    @Delete()
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete the authenticated user profile' })
    @ApiResponse({
        status: 204,
        description: 'User profile successfully deleted',
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async deleteProfile(@Req() req: AuthRequest): Promise<void> {
        const userId = req.user.userId;

        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : '';

        await this.userService.delete(userId, accessToken);
    }
}
