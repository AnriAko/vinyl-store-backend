import { BadRequestException } from '@nestjs/common';

export function validatePagination(page: number, limit: number) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
        !Number.isFinite(parsedPage) ||
        !Number.isInteger(parsedPage) ||
        parsedPage < 1
    ) {
        throw new BadRequestException('Page must be a positive integer');
    }

    if (
        !Number.isFinite(parsedLimit) ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1
    ) {
        throw new BadRequestException('Limit must be a positive integer');
    }

    return { parsedPage, parsedLimit };
}
