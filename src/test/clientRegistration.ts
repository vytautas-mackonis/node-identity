import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';
import * as data from './infrastructure/data';

function assertClient(tenantId: string, client: data.Client) {
    it('Should list client using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClients(tenantId));
        httpAssert.expectStatusCode(response, 200);
        let clients = response.body;
        _.remove<any>(clients, c => c.id === settings.adminClientId);
        expect(clients).to.eql([
            client
        ]);
    });

    it('Should get client by id using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClient(tenantId, client.id));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(client);
    });
}

describe('Client registration', () => {
    const tenant = data.randomTenant();

    describe('After registering a client', () => {
        const client = data.randomClient();

        before(async () => {
            await api.reset();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            let clientCopy = Object.assign({}, client);
            delete clientCopy['id'];
            response = await http.putJson(urls.adminClient(tenant.id, client.id), clientCopy);
            httpAssert.expectStatusCode(response, 201);
            delete client.secret;
        });

        assertClient(tenant.id, client);
    });

    describe('After registering and updating a client', () => {
        const client = data.randomClient();

        before(async () => {
            await api.reset();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClient(tenant.id, client.id), {
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
            response = await http.putJson(urls.adminClient(tenant.id, client.id), clientCopy);
            httpAssert.expectStatusCode(response, 200);
            delete client.secret;
        });

        assertClient(tenant.id, client);
    });

    describe('After registering two clients and deleting one', () => {
        const client = data.randomClient();
        const deleted = data.randomClient();
        
        before(async () => {
            await api.reset();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            let clientCopy = Object.assign({}, client);
            delete clientCopy['id'];
            response = await http.putJson(urls.adminClient(tenant.id, client.id), clientCopy);
            httpAssert.expectStatusCode(response, 201);
            clientCopy = Object.assign({}, deleted);
            delete clientCopy['id'];
            response = await http.putJson(urls.adminClient(tenant.id, deleted.id), clientCopy);
            httpAssert.expectStatusCode(response, 201);
            response = await http.delete(urls.adminClient(tenant.id, deleted.id));
            httpAssert.expectStatusCode(response, 200);
            delete client.secret;
        });

        assertClient(tenant.id, client);

        it('Should not get deleted client by id using admin user', async () => {
            let http = await api.defaultAdminClient();
            let response = await http.getJson(urls.adminClient(tenant.id, deleted.id));
            httpAssert.expectStatusCode(response, 404);
        });
    });
});
