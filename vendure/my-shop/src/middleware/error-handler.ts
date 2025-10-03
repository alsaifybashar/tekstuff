import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@vendure/core';

@Catch()
export class GlobalErrorHandler implements ExceptionFilter {
    private readonly logger = new Logger('GlobalErrorHandler');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            message = (errorResponse as any).message || exception.message;
            errorCode = (errorResponse as any).errorCode || 'HTTP_ERROR';
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        }

        // Log error details
        this.logger.error(
            `Error ${status} on ${request.method} ${request.url}`,
            JSON.stringify({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                message,
                errorCode,
                ip: request.ip,
                userAgent: request.get('user-agent'),
            }),
        );

        // Send error response
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            errorCode,
            ...(process.env.APP_ENV === 'dev' && {
                stack: exception instanceof Error ? exception.stack : undefined,
            }),
        });
    }
}