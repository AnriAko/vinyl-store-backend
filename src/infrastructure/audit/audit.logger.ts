import winston from 'winston';

const { combine, timestamp, printf } = winston.format;

const auditFormat = printf(({ timestamp, message }) => {
    return `${timestamp} ${message}`;
});

export const auditLogger = winston.createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), auditFormat),
    transports: [
        new winston.transports.File({
            filename: 'logs/audit.log',
            level: 'info',
        }),
    ],
});
