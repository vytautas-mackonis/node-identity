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
