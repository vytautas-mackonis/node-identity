import * as api from './infrastructure/api';
import * as settings from './infrastructure/settings';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import * as uuid from 'node-uuid';
import * as data from './infrastructure/data';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as nconf from 'nconf';
import { expect } from 'chai';
import { delay } from './infrastructure/utils';

describe('Authentication', () => {
    function shouldFailToLogin(grantType: string, user: string, password: string, clientId: string, clientSecret: string) {
        it(`Should not login with grant: ${grantType}, username: ${user}, password: ${password}, client: ${clientId}, client secret: ${clientSecret}`, async () => {
            let client = api.anonymousClient();
            let response = await client.postFormData(urls.token(), {
                grant_type: grantType,
                username: user,
                password: password,
                client_id: clientId,
                client_secret: clientSecret
            });

            httpAssert.expectStatusCode(response, 400);
        });
    }

    shouldFailToLogin('password', settings.defaultUsername, settings.defaultPassword, settings.adminClientId, uuid.v4());
    shouldFailToLogin('password', settings.defaultUsername, settings.defaultPassword, uuid.v4(), settings.adminClientSecret);
    shouldFailToLogin('password', settings.defaultUsername, uuid.v4(), settings.adminClientId, settings.adminClientSecret);
    shouldFailToLogin('password', uuid.v4(), settings.defaultPassword, settings.adminClientId, settings.adminClientSecret);
    shouldFailToLogin(uuid.v4(), settings.defaultUsername, settings.defaultPassword, settings.adminClientId, settings.adminClientSecret);

    it('Should login with default credentials', async () => {
        let client = api.anonymousClient();
        let response = await client.postFormData(urls.token(), {
            grant_type: 'password',
            username: settings.defaultUsername,
            password: settings.defaultPassword,
            client_id: settings.adminClientId,
            client_secret: settings.adminClientSecret
        });

        httpAssert.expectStatusCode(response, 200);
    });

    it('Should login with newly created credentials', async () => {
        const tenant = data.randomTenant();
        const client = data.randomClient();
        client.applicationType = 'Confidential';
        client.active = true;
        const user = data.randomUser();
        const claims = [
            data.randomClaim(),
            data.randomClaim(),
            data.randomClaim()
        ];

        await api.reset();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminClaims(tenant.id, user.id), claims);
        httpAssert.expectStatusCode(response, 200);
        let password = uuid.v4();
        response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), { password: password });
        httpAssert.expectStatusCode(response, 200);

        response = await api.login(user.login, password, client.id, client.secret);
        httpAssert.expectStatusCode(response, 200);

        const publicKey = nconf.get('jwtPublicKey');
        const tokenPayload = jwt.verify(response.body.access_token, publicKey, { algorithms: ['RS256'] });
        delete tokenPayload.iat;
        delete tokenPayload.exp;

        let expectedPayload = _.chain(claims).keyBy(x => x.key).mapValues((x:any) => x.value).value();
        expectedPayload['ni:tenantId'] = tenant.id;
        expectedPayload['ni:userId'] = user.id;
        expectedPayload['ni:login'] = user.login;
        expect(tokenPayload).to.be.eql(expectedPayload);
    });

    it('Should not login with deleted client', async () => {
        const tenant = data.randomTenant();
        const client = data.randomClient();
        client.applicationType = 'Confidential';
        client.active = true;
        const user = data.randomUser();

        await api.reset();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
        httpAssert.expectStatusCode(response, 201);
        let password = uuid.v4();
        response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), { password: password });
        httpAssert.expectStatusCode(response, 200);

        response = await http.delete(urls.adminClient(tenant.id, client.id));
        httpAssert.expectStatusCode(response, 200);

        response = await api.login(user.login, password, client.id, client.secret);
        httpAssert.expectStatusCode(response, 400);
    });

    it('Should not login with inactive client', async () => {
        const tenant = data.randomTenant();
        const client = data.randomClient();
        client.applicationType = 'Confidential';
        client.active = false;
        const user = data.randomUser();

        await api.reset();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
        httpAssert.expectStatusCode(response, 201);
        let password = uuid.v4();
        response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), { password: password });
        httpAssert.expectStatusCode(response, 200);

        response = await api.login(user.login, password, client.id, client.secret);
        httpAssert.expectStatusCode(response, 400);
    });

    it('Should not login with deleted user', async () => {
        const tenant = data.randomTenant();
        const client = data.randomClient();
        client.applicationType = 'Confidential';
        client.active = true;
        const user = data.randomUser();

        await api.reset();
        let http = await api.defaultAdminClient();
        let response = await http.putJson(urls.tenant(tenant.id), tenant);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
        httpAssert.expectStatusCode(response, 201);
        response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
        httpAssert.expectStatusCode(response, 201);
        let password = uuid.v4();
        response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), { password: password });
        httpAssert.expectStatusCode(response, 200);

        response = await http.delete(urls.adminUser(tenant.id, user.id));
        httpAssert.expectStatusCode(response, 200);

        response = await api.login(user.login, password, client.id, client.secret);
        httpAssert.expectStatusCode(response, 400);
    });

    describe('Token expiration', async() => {
        before(async() => {
            nconf.remove('defaults');
            nconf.remove('file');
            nconf.remove('testconfig');
            nconf.use('token_expiration_override', { type: 'literal', store: { 'accessTokenExpirationSeconds': 1 }});
            await api.reset();
        });

        after(async() => {
            nconf.remove('token_expiration_override');
        });

        it('Should expire issued tokens', async () => {
            const http = await api.defaultAdminClient();
            await delay(1100);

            const response = await http.getJson(urls.tenants());
            httpAssert.expectStatusCode(response, 401);
        });
    });

});
