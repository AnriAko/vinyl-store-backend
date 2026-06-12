import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '~/utils/logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();

            if (typeof res === 'string') {
                message = res;
            } else if (
                typeof res === 'object' &&
                res !== null &&
                'message' in res
            ) {
                const msgField = (res as Record<string, unknown>).message;
                if (Array.isArray(msgField)) {
                    message =
                        typeof msgField[0] === 'string'
                            ? msgField[0]
                            : JSON.stringify(msgField[0]);
                } else if (typeof msgField === 'string') {
                    message = msgField;
                } else {
                    message = JSON.stringify(msgField);
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        logger.error(
            `[${status}] ${JSON.stringify(message)} - ${request.method} ${request.url}`
        );

        response.status(status).json({ error: message });
    }
}
