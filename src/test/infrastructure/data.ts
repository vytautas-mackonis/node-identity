import * as uuid from 'node-uuid';

export interface Tenant {
    id: string;
    name: string;
}

export interface Client {
    id: string;
    name: string;
    secret: string;
    applicationType: string;
    allowedOrigin: string;
    refreshTokenLifetime: number;
    active: boolean;
}

export interface User {
    id: string;
    name: string;
    login: string;
    email: string;
}

export function randomTenant() : Tenant {
    return {
        id: uuid.v4(),
        name: uuid.v4()
    };
}

export function randomClient() : Client {
    return {
        id: uuid.v4(),
        name: uuid.v4(),
        secret: uuid.v4(),
        applicationType: Math.random() > 0.5 ? 'Public': 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };
}

export function randomUser() : User {
    return {
        id: uuid.v4(),
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };
}
