import * as jwt from 'jsonwebtoken';
import * as file from 'fs';
import { TokenProvider } from './token';

const jwtSecret = 'secret';

export interface JwtOptions {
    privateKey: string;
    publicKey: string;
}

export class JwtTokenProvider implements TokenProvider {
    constructor(private options: JwtOptions) {}

    sign(payload: any): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(payload, this.options.privateKey, { algorithm: 'RS256' }, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }

    verify<T>(token: string) : Promise<T> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.options.publicKey, { algorithms: [ 'RS256' ] }, (err, payload) => {
                if (err) {

                    console.error(err);
                    reject(err);
                } else {
                    resolve(payload);
                }
            });
        });
    }
}

