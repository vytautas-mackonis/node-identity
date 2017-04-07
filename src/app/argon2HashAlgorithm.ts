import * as argon2 from 'argon2';
import { HashAlgorithm } from './hashAlgorithm';

export interface Argon2Options {
    timeCost: number;
    memoryCost: number;
    parallelism: number;
}

export class Argon2HashAlgorithm implements HashAlgorithm {
    constructor(private options: Argon2Options) {}

    public async computeHash(password: string) {
        const salt = await argon2.generateSalt(32);
        const hash = await argon2.hash(password, salt, this.options);
        return hash;
    }

    public async verifyHash(hash: string, passwordAttempt: string) {
        return await argon2.verify(hash, passwordAttempt);
    }
}
