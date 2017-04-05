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
