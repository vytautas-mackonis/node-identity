import * as argon2 from 'argon2';
import { HashAlgorithm } from './hashAlgorithm';

export class Argon2HashAlgorithm implements HashAlgorithm {
    public async computeHash(password: string) {
        const salt = await argon2.generateSalt(32);
        const hash = await argon2.hash(password, salt);
        return hash;
    }

    public async verifyHash(hash: string, passwordAttempt: string) {
        return await argon2.verify(hash, passwordAttempt);
    }
}
