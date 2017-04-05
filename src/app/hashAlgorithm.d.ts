export interface HashAlgorithm {
    computeHash(password: string): Promise<string>;
    verifyHash(hash: string, passwordAttempt: string): Promise<boolean>;
}

