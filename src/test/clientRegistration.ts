import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';

interface Client {
    id: string;
    name: string;
    tenantId: string;
    applicationType: string;
    allowedOrigin: string;
    refreshTokenLifetime: number;
    active: boolean;
}

function assertClient(client: Client) {
    it('Should list client by admin', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.clients());
        httpAssert.expectStatusCode(response, 200);
        let clients = response.body;
        expect(clients).to.eql([
            client
        ]);
    });

    it('Should get client by id using admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.client(client.id));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(client);
    });
}

describe('After registering a client', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const client = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant.id,
        applicationType: Math.random() > 0.5 ? 'Public' : 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        let clientCopy = Object.assign({}, client);
        delete clientCopy['id'];
        clientCopy['secret'] = uuid.v4();
        response = await http.putJson(urls.client(client.id), clientCopy);
        httpAssert.expectStatusCode(response, 201);
    });

    assertClient(client);
});

describe('After registering and updating a client', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const client = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant.id,
        applicationType: Math.random() > 0.5 ? 'Public' : 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.client(client.id), {
            name: uuid.v4(),
            tenantId: tenant.id,
            applicationType: Math.random() > 0.5 ? 'Public' : 'Confidential',
            allowedOrigin: uuid.v4(),
            active: Math.random() > 0.5,
            refreshTokenLifetime: Math.round(Math.random() * 10000),
            secret: uuid.v4()
        });
        httpAssert.expectStatusCode(response, 201);
        let clientCopy = Object.assign({}, client);
        delete clientCopy['id'];
        clientCopy['secret'] = uuid.v4();
        response = await http.putJson(urls.client(client.id), clientCopy);
        httpAssert.expectStatusCode(response, 200);
    });

    assertClient(client);
});

describe('After registering two clients and deleting one', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const client = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant.id,
        applicationType: Math.random() > 0.5 ? 'Public' : 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    const deleted = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant.id,
        applicationType: Math.random() > 0.5 ? 'Public' : 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        let clientCopy = Object.assign({}, client);
        delete clientCopy['id'];
        clientCopy['secret'] = uuid.v4();
        response = await http.putJson(urls.client(client.id), clientCopy);
        httpAssert.expectStatusCode(response, 201);
        clientCopy = Object.assign({}, deleted);
        delete clientCopy['id'];
        clientCopy['secret'] = uuid.v4();
        response = await http.putJson(urls.client(deleted.id), clientCopy);
        httpAssert.expectStatusCode(response, 201);
        response = await http.delete(urls.client(deleted.id));
        httpAssert.expectStatusCode(response, 200);
    });

    assertClient(client);

    it('Should not get deleted client by id using admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.client(deleted.id));
        httpAssert.expectStatusCode(response, 404);
    });
});
