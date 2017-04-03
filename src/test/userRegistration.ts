import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';

interface User {
    id: string;
    name: string;
    tenantId: string;
    login: string;
    email: string;
}

function assertUser(user: User) {
    it('Should list user by admin', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.users());
        httpAssert.expectStatusCode(response, 200);
        let users = response.body;
        expect(users).to.eql([
            user
        ]);
    });

    it('Should get user by id using admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.user(user.id, user.tenantId));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(user);
    });
}

describe('After registering a user', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const user = {
        id: uuid.v4(),
        tenantId: tenant.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.user(user.id), user);
        httpAssert.expectStatusCode(response, 201);
    });

    assertUser(user);
});

describe('After registering and updating a user', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const user = {
        id: uuid.v4(),
        tenantId: tenant.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.user(user.id), {
            id: user.id,
            tenantId: user.tenantId,
            login: uuid.v4(),
            name: uuid.v4(),
            email: uuid.v4() + '@' + uuid.v4() + '.com'
        });
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.user(user.id), user);
        httpAssert.expectStatusCode(response, 200);
    });

    assertUser(user);
});

describe('After registering two users and deleting one', () => {
    const tenant = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const user = {
        id: uuid.v4(),
        tenantId: tenant.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    const deleted = {
        id: uuid.v4(),
        tenantId: tenant.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    before(async () => {
        await api.dropDatabase();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.user(user.id), user);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.user(deleted.id), deleted);
        httpAssert.expectStatusCode(response, 201);
        response = await http.delete(urls.user(deleted.id, deleted.tenantId));
        httpAssert.expectStatusCode(response, 200);
    });

    assertUser(user);
    
    it('Should not get deleted user by id using admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.user(deleted.id, deleted.tenantId));
        httpAssert.expectStatusCode(response, 404);
    });
});
