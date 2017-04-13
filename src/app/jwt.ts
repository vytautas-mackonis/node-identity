import * as jwt from 'jsonwebtoken';
import * as file from 'fs';
import { TokenProvider } from './token';
import * as _ from 'lodash';

export interface JwtOptions {
    privateKey: string;
    publicKey: string;
    expirationSeconds: number;
}

export class JwtTokenProvider implements TokenProvider {
    constructor(private options: JwtOptions) {
        if (!_.isString(options.privateKey))
            throw new Error('JWT private key must be a PEM encoded string');
        if (!_.isString(options.publicKey))
            throw new Error('JWT public key must be a PEM encoded string');
    }

    sign(payload: any): Promise<string> {
        jwt.sign(payload, this.options.privateKey, { algorithm: 'RS256', expiresIn: this.options.expirationSeconds });

        return new Promise((resolve, reject) => {
            try {
                jwt.sign(payload, this.options.privateKey, { algorithm: 'RS256', expiresIn: this.options.expirationSeconds }, (err, token) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(token);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    verify<T>(token: string) : Promise<T> {
        return new Promise((resolve, reject) => {
            try {
                jwt.verify(token, this.options.publicKey, { algorithms: [ 'RS256' ], ignoreExpiration: true }, (err, payload) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(payload);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

