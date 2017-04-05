export function token() {
    return 'token';
}

export function tenants() {
    return 'tenants';
}

export function tenant(id: string) {
    return `tenants/${id}`;
}

export function clients() {
    return 'clients';
}

export function client(id: string) {
    return `clients/${id}`;
}

export function users() {
    return 'users';
}

export function user(id: string, tenantId?: string) {
    let query = tenantId ? '?tenantId=' + tenantId : '';
    return `users/${id}${query}`;
}

export function userPassword(id: string, tenantId: string) {
    return `users/${id}/password?tenantId=${tenantId}`;
}
