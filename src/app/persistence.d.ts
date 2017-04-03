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

export interface OAuthPersistence {
    tenants: TenantService;
}
