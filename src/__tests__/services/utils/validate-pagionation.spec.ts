import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
import { validatePagination } from '~/utils/validate-pagination';

describe('validatePagination', () => {
    it('should return parsed page and limit for valid positive integers', () => {
        const { parsedPage, parsedLimit } = validatePagination(1, 10);
        assert.equal(parsedPage, 1);
        assert.equal(parsedLimit, 10);

        const result = validatePagination('5' as any, '20' as any);
        assert.equal(result.parsedPage, 5);
        assert.equal(result.parsedLimit, 20);
    });

    it('should throw BadRequestException for non-integer page', () => {
        try {
            validatePagination(1.5, 10);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Page must be a positive integer');
        }
    });

    it('should throw BadRequestException for non-integer limit', () => {
        try {
            validatePagination(1, 10.5);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Limit must be a positive integer');
        }
    });

    it('should throw BadRequestException for page < 1', () => {
        try {
            validatePagination(0, 10);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Page must be a positive integer');
        }
    });

    it('should throw BadRequestException for limit < 1', () => {
        try {
            validatePagination(1, 0);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Limit must be a positive integer');
        }
    });

    it('should throw BadRequestException for non-numeric page', () => {
        try {
            validatePagination('abc' as any, 10);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Page must be a positive integer');
        }
    });

    it('should throw BadRequestException for non-numeric limit', () => {
        try {
            validatePagination(1, 'xyz' as any);
            throw new Error('Should have thrown');
        } catch (err: any) {
            if (!(err instanceof BadRequestException)) throw err;
            assert.equal(err.message, 'Limit must be a positive integer');
        }
    });
});
