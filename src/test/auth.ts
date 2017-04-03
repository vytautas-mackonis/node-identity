import * as api from './infrastructure/api';
import * as settings from './infrastructure/settings';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import * as uuid from 'node-uuid';

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
});
