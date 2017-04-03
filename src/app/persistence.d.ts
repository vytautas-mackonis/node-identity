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
    secret: string;
    tenantId: string;
}

interface Client extends ClientSaveRequest {
    id: string;
    secretSalt: string;
}

interface ClientFilter {
    id?: string;
    tenantId?: string;
}

export interface ClientService {
    getById(id: string): Promise<maybe.Maybe<Client>>;
    getByIdAndSecret(id: string, secret: string): Promise<maybe.Maybe<Client>>;
    query(filter: ClientFilter): Promise<Client[]>;
    save(id: string, client: ClientSaveRequest): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export interface OAuthPersistence {
    tenants: TenantService;
    clients: ClientService;
}
