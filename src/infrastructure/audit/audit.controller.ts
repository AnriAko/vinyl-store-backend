import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/entities/user.entity';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiProduces,
    ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Roles(UserRole.ADMIN)
    @Get()
    @ApiOperation({
        summary: 'Stream audit logs',
        description:
            'Streams the full audit log file as plain text. Only accessible to admin users.',
    })
    @ApiProduces('text/plain')
    @ApiResponse({
        status: 200,
        description: 'The audit log file streamed successfully.',
        content: {
            'text/plain': {
                schema: {
                    type: 'string',
                    example:
                        '[2025-10-28 12:00:00] [CREATE] Entity "User" created: {...}',
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden. Only administrators can access audit logs.',
    })
    async streamAuditLogs(@Res() res: Response) {
        const stream = this.auditService.getLogStream();
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');

        stream.pipe(res);
    }
}
