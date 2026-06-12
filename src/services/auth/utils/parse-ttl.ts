export function parseTtl(ttl: string): number {
    const defaultTtl = 60 * 60 * 24 * 7;

    if (!ttl || ttl.trim() === '') {
        return defaultTtl;
    }

    const match = /^(\d+(\.\d+)?)([smhd])$/.exec(ttl);
    if (match) {
        const [, num, , unit] = match;
        const n = Number(num);

        switch (unit) {
            case 's':
                return n;
            case 'm':
                return n * 60;
            case 'h':
                return n * 60 * 60;
            case 'd':
                return n * 60 * 60 * 24;
            default:
                return defaultTtl;
        }
    }

    const n = Number(ttl);
    return !isNaN(n) ? n : defaultTtl;
}
