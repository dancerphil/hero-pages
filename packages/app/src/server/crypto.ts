const PBKDF2_ITERATIONS = 100_000;

const toHex = (bytes: Uint8Array) =>
    [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
    Uint8Array.from(hex.match(/../g) ?? [], pair => Number.parseInt(pair, 16));

async function derivePassword(input: { password: string; salt: Uint8Array }) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(input.password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: input.salt as unknown as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        key,
        256,
    );
    return toHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return `${toHex(salt)}:${await derivePassword({ password, salt })}`;
}

export async function verifyPassword(input: { password: string; stored: string }) {
    const [saltHex, hash] = input.stored.split(':');
    return (await derivePassword({ password: input.password, salt: fromHex(saltHex) })) === hash;
}

export function randomToken() {
    return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function randomDigits(length: number) {
    const max = 10 ** length;
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % max).padStart(length, '0');
}
