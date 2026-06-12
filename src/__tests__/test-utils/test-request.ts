import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Express } from 'express';

export function createTestRequest(app: INestApplication) {
    const server = app.getHttpServer() as Express;

    return request(server);
}
