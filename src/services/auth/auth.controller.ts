import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiResponse,
    ApiTags,
    ApiOperation,
} from '@nestjs/swagger';
import { AuthTokenInterceptor } from '~/services/auth/interceptors/auth-token.interceptor';
import { UserRole } from '~/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '~/services/auth/auth.service';
import { Public } from '~/common/decorators/public.decorator';
import { CreateUserDto } from '~/services/user/dto/create-user.dto';
import { LoginDto } from '~/services/auth/dto/login.dto';
import { RefreshAuthGuard } from '~/services/auth/guards/refresh-auth/refresh-auth.guard';
import { AuthRequest } from '~/types/auth-request';

@ApiTags('Auth')
@UseInterceptors(AuthTokenInterceptor)
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: 201,
        description:
            'User registered successfully. Access token returned in header, refresh token set in cookie.',
        headers: {
            Authorization: {
                description: 'Bearer access token',
                schema: {
                    type: 'string',
                    example: 'Bearer jwt-access-token',
                },
            },
            'Set-Cookie': {
                description: 'HttpOnly cookie containing refresh token',
                schema: {
                    type: 'string',
                    example:
                        'refreshToken=jwt-refresh-token; Path=/; HttpOnly; SameSite=Lax;',
                },
            },
        },
        schema: {
            example: {
                id: 'uuid',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                avatar: 'https://example.com/avatar.png',
                role: 'user',
            },
        },
    })
    @ApiResponse({
        status: 409,
        description: 'User with this email already exists',
    })
    async register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('register/admin')
    @ApiOperation({ summary: 'Register a new admin' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: 201,
        description:
            'Admin registered successfully. Access token returned in header, refresh token set in cookie.',
    })
    async registerAdmin(@Body() dto: CreateUserDto) {
        return this.authService.register(dto, UserRole.ADMIN);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({
        description:
            'Login successful. Access token returned in header, refresh token set in cookie.',
        headers: {
            Authorization: {
                description: 'Bearer access token',
                schema: {
                    type: 'string',
                    example: 'Bearer jwt-access-token',
                },
            },
            'Set-Cookie': {
                description: 'HttpOnly cookie containing refresh token',
                schema: {
                    type: 'string',
                    example:
                        'refreshToken=jwt-refresh-token; Path=/; HttpOnly; SameSite=Lax;',
                },
            },
        },
        schema: {
            example: {
                id: 'uuid',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                avatar: 'https://example.com/avatar.png',
                role: 'user',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials (wrong email or password)',
    })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout user (removes tokens)' })
    @ApiResponse({ status: 204, description: 'User successfully logged out' })
    async logout(@Req() req: AuthRequest, @Res() res: Response) {
        const userId = req.user.userId;
        const rawHeader = req.headers.authorization;
        const accessToken =
            typeof rawHeader === 'string'
                ? rawHeader.replace('Bearer ', '')
                : (req.cookies?.accessToken ?? null);

        if (userId && typeof accessToken === 'string') {
            await this.authService.logout(userId, accessToken);
        }

        res.clearCookie('refreshToken', { path: '/' });
        return res.send();
    }

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh JWT tokens' })
    @ApiBearerAuth()
    @ApiOkResponse({
        description:
            'Tokens refreshed. Access token returned in header, refresh token set in cookie.',
        headers: {
            Authorization: {
                description: 'New Bearer access token',
                schema: {
                    type: 'string',
                    example: 'Bearer new-jwt-access-token',
                },
            },
            'Set-Cookie': {
                description: 'New HttpOnly cookie with refresh token',
                schema: {
                    type: 'string',
                    example:
                        'refreshToken=new-jwt-refresh-token; Path=/; HttpOnly; SameSite=Lax;',
                },
            },
        },
        schema: {
            example: {
                message: 'Tokens refreshed successfully',
            },
        },
    })
    async refreshTokens(@Req() req: AuthRequest) {
        const userId = req.user.userId;
        return this.authService.refreshTokens(userId);
    }

    @Public()
    @UseGuards(AuthGuard('google-user'))
    @Get('google/login')
    @ApiOperation({ summary: 'Redirect to Google OAuth (user)' })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Google OAuth login page',
    })
    googleLogin() {}

    @Public()
    @UseGuards(AuthGuard('google-user'))
    @Get('google/callback')
    @ApiOperation({ summary: 'Handle Google OAuth callback (user)' })
    @ApiResponse({
        status: 200,
        description:
            'Returns JWT tokens for the authenticated Google user (in header + cookie)',
    })
    async googleCallback(@Req() req: AuthRequest) {
        const userId = req.user.userId;
        return this.authService.refreshTokens(userId);
    }

    @Public()
    @UseGuards(AuthGuard('google-admin'))
    @Get('google/login/admin')
    @ApiOperation({ summary: 'Redirect to Google OAuth (admin)' })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Google OAuth login page for admin',
    })
    googleAdminLogin() {}

    @Public()
    @UseGuards(AuthGuard('google-admin'))
    @Get('google/callback/admin')
    @ApiOperation({ summary: 'Handle Google OAuth callback (admin)' })
    @ApiResponse({
        status: 200,
        description:
            'Returns JWT tokens for the authenticated Google admin (in header + cookie)',
    })
    async googleAdminCallback(@Req() req: AuthRequest) {
        const userId = req.user.userId;
        return this.authService.refreshTokens(userId);
    }
}
