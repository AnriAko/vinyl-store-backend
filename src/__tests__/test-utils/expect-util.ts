import assert from 'node:assert';

type Constructor = new (...args: unknown[]) => unknown;

class Expect<T> {
    private inverse = false;
    private actual: T;

    constructor(actual: T) {
        this.actual = actual;
    }

    get not(): this {
        this.inverse = !this.inverse;
        return this;
    }

    toBe(expected: T): void {
        const pass = Object.is(this.actual, expected);
        this.check(pass, `Expected ${this.actual} to be ${expected}`);
    }

    toEqual(expected: unknown): void {
        const pass = JSON.stringify(this.actual) === JSON.stringify(expected);
        this.check(
            pass,
            `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`
        );
    }
    toStrictEqual(expected: unknown): void {
        this.toEqual(expected);
    }

    toBeTruthy(): void {
        this.check(
            !!this.actual,
            `Expected value to be truthy, got ${this.actual}`
        );
    }

    toBeFalsy(): void {
        this.check(
            !this.actual,
            `Expected value to be falsy, got ${this.actual}`
        );
    }

    toBeDefined(): void {
        this.check(this.actual !== undefined, `Expected value to be defined`);
    }

    toBeUndefined(): void {
        this.check(this.actual === undefined, `Expected value to be undefined`);
    }

    toBeNull(): void {
        this.check(this.actual === null, `Expected value to be null`);
    }

    toContain<U>(item: U): void {
        const actual = this.actual;
        const pass = Array.isArray(actual)
            ? actual.includes(item)
            : typeof actual === 'string'
              ? actual.includes(String(item))
              : false;
        this.check(
            pass,
            `Expected ${String(actual)} to contain ${String(item)}`
        );
    }

    toBeInstanceOf<C extends Constructor>(ctor: C): void {
        this.check(
            this.actual instanceof ctor,
            `Expected ${this.actual} to be instance of ${ctor.name}`
        );
    }

    toThrow(expectedMessage?: string): void {
        if (typeof this.actual !== 'function') {
            throw new TypeError('toThrow matcher requires a function');
        }
        let threw = false;
        try {
            (this.actual as unknown as () => unknown)();
        } catch (err) {
            threw = expectedMessage
                ? err instanceof Error && err.message.includes(expectedMessage)
                : true;
        }
        this.check(
            threw,
            `Expected function to throw${expectedMessage ? ` with message including "${expectedMessage}"` : ''}`
        );
    }

    toMatch(expected: RegExp | string): void {
        const actual = String(this.actual);
        const pass =
            expected instanceof RegExp
                ? expected.test(actual)
                : actual.includes(expected);
        this.check(pass, `Expected ${actual} to match ${expected}`);
    }

    toHaveProperty(path: string, expectedValue?: unknown): void {
        const parts = path.split('.');
        let current: any = this.actual;
        for (const part of parts) {
            if (current == null || !(part in current)) {
                this.check(
                    false,
                    `Expected object to have property '${path}', but '${part}' was not found`
                );
                return;
            }
            current = current[part];
        }
        if (arguments.length === 2) {
            this.check(
                Object.is(current, expectedValue),
                `Expected property '${path}' to be ${expectedValue}, got ${current}`
            );
        } else {
            this.check(true, `Expected object to have property '${path}'`);
        }
    }

    toBeGreaterThan(expected: number): void {
        if (typeof (this.actual as any) !== 'number') {
            throw new TypeError(
                `toBeGreaterThan matcher requires a number, got ${typeof this.actual}`
            );
        }
        this.check(
            (this.actual as any) > expected,
            `Expected ${this.actual} to be greater than ${expected}`
        );
    }

    toBeLessThan(expected: number): void {
        if (typeof (this.actual as any) !== 'number') {
            throw new TypeError(
                `toBeLessThan matcher requires a number, got ${typeof this.actual}`
            );
        }
        this.check(
            (this.actual as any) < expected,
            `Expected ${this.actual} to be less than ${expected}`
        );
    }

    toHaveBeenCalled(): void {
        const spy = this.actual as any;
        const pass = spy && typeof spy === 'function' && spy.called === true;
        this.check(pass, `Expected spy to have been called`);
    }

    toHaveBeenCalledWith(...expectedArgs: any[]): void {
        const spy = this.actual as any;
        if (!spy || typeof spy !== 'function' || !Array.isArray(spy.calls)) {
            throw new TypeError(
                'toHaveBeenCalledWith matcher requires a spy function'
            );
        }
        const pass = spy.calls.some(
            (call: any[]) =>
                JSON.stringify(call) === JSON.stringify(expectedArgs)
        );
        this.check(
            pass,
            `Expected spy to have been called with ${JSON.stringify(expectedArgs)}; got ${JSON.stringify(spy.calls)}`
        );
    }
    toMatchObject(expected: Record<string, any>): void {
        const actual = this.actual as Record<string, any>;
        const pass = Object.entries(expected).every(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(actual[key]) === JSON.stringify(value);
            }
            return actual[key] === value;
        });
        this.check(
            pass,
            `Expected object ${JSON.stringify(actual)} to match ${JSON.stringify(expected)}`
        );
    }
    toBeCloseTo(expected: number, digits = 2): void {
        if (typeof this.actual !== 'number') {
            throw new TypeError(
                `toBeCloseTo matcher requires a number, got ${typeof this.actual}`
            );
        }
        const precision = 10 ** digits;
        const pass =
            Math.round((this.actual as number) * precision) ===
            Math.round(expected * precision);
        this.check(
            pass,
            `Expected ${this.actual} to be close to ${expected} with ${digits} digits precision`
        );
    }

    private check(pass: boolean, message: string): void {
        if (this.inverse) pass = !pass;
        assert.ok(pass, this.inverse ? `NOT: ${message}` : message);
        this.inverse = false;
    }
}

export function expect<T>(actual: T): Expect<T> {
    return new Expect<T>(actual);
}
