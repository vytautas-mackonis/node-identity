export function token() {
    return 'token';
}

export function tenants() {
    return 'admin/tenants';
}

export function tenant(id: string) {
    return `admin/tenants/${id}`;
}

export function adminClients(tenantId: string) {
    return `admin/tenants/${tenantId}/clients`;
}

export function adminClient(tenantId: string, id: string) {
    return `admin/tenants/${tenantId}/clients/${id}`;
}

export function adminUsers(tenantId: string) {
    return `admin/tenants/${tenantId}/users`;
}

export function adminUser(tenantId: string, id: string) {
    return `admin/tenants/${tenantId}/users/${id}`;
}

export function adminUserPassword(tenantId: string, id: string) {
    return `admin/tenants/${tenantId}/users/${id}/password`;
}

export function adminClaims(tenantId: string, userId: string) {
    return `admin/tenants/${tenantId}/users/${userId}/claims`;
}

export function adminClaim(tenantId: string, userId: string, key: string) {
    return `admin/tenants/${tenantId}/users/${userId}/claims/${encodeURIComponent(key)}`;
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

export function user(id: string) {
    return `users/${id}`;
}

export function claims(userId: string) {
    return `users/${userId}/claims`;
}

export function claim(userId: string, key: string) {
    return `users/${userId}/claims/${encodeURIComponent(key)}`;
}
