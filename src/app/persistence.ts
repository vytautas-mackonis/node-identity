import * as maybe from './maybe';

export interface Tenant {
    id: string;
    name: string;
}

export interface TenantFilter {
    id?: string;
    name?: string;
}

export interface TenantService {
    query(filter: TenantFilter): Promise<Tenant[]>;
    save(tenant: Tenant): Promise<boolean>;
    getById(id: string): Promise<maybe.Maybe<Tenant>>;
    delete(id: string): Promise<void>;
}

interface ClientSaveRequest {
    active: boolean;
    allowedOrigin: string;
    applicationType: string;
    name: string;
    refreshTokenLifetime: number;
    secretHash: string;
    tenantId: string;
}

export interface Client extends ClientSaveRequest {
    id: string;
}

export interface ClientFilter {
    id?: string;
    tenantId?: string;
}

export interface ClientService {
    getById(id: string): Promise<maybe.Maybe<Client>>;
    query(filter: ClientFilter): Promise<Client[]>;
    save(id: string, client: ClientSaveRequest): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export interface User {
    id: string;
    tenantId: string;
    login: string;
    name: string;
    email: string;
    passwordHash: string;
}

export class DuplicateLoginError extends Error {
    constructor(login: string) {
        super(`A user with login '${login}' already exists`);
        Object.setPrototypeOf(this, DuplicateLoginError.prototype);
    }
}

export class DuplicateEmailError extends Error {
    constructor(email: string) {
        super(`A user with email '${email}' already exists`);
        Object.setPrototypeOf(this, DuplicateLoginError.prototype);
    }
}

export interface UserFilter {
    userId?: string;
    tenantId?: string;
    email?: string;
    login?: string;
    claimType?: string;
    claimValue?: string;
}

export interface Claim {
    key: string;
    value: string;
}

export interface UserService {
    query(filter: UserFilter): Promise<User[]>;
    getById(tenantId: string, id: string): Promise<maybe.Maybe<User>>;
    getByLogin(tenantId: string, login: string): Promise<maybe.Maybe<User>>;
    getByPasswordResetToken(token: string): Promise<maybe.Maybe<User>>;
    save(tenantId: string, id: string, login: string, email: string, name: string): Promise<boolean>;
    changePassword(tenantId: string, id: string, passwordHash: string): Promise<void>;
    delete(tenantId: string, id: string): Promise<void>;

    claimsForUser(tenantId: string, userId: string) : Promise<Claim[]>;
    setUserClaim(tenantId: string, userId: string, claim: Claim): Promise<boolean>;
    replaceUserClaims(tenantId: string, userId: string, claims: Claim[]): Promise<void>;
    removeUserClaim(tenantId: string, userId: string, claimKey: string): Promise<void>;
}

export interface DatabaseInitializer {
    initialize(): Promise<void>;
}

export interface OAuthPersistence {
    tenants: TenantService;
    clients: ClientService;
    users: UserService;
    initializer: DatabaseInitializer;
}
