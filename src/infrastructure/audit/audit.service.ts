import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class AuditService {
    private readonly logFilePath = path.resolve('logs/audit.log');

    getLogStream(): Readable {
        if (!fs.existsSync(this.logFilePath)) {
            return Readable.from([]);
        }

        return fs.createReadStream(this.logFilePath, {
            encoding: 'utf-8',
        });
    }
}
