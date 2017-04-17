import * as api from './infrastructure/api';
import * as settings from './infrastructure/settings';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import * as jwt from 'jsonwebtoken';
import * as nconf from 'nconf';
import { expect } from 'chai';
import { delay } from './infrastructure/utils';

describe('Refresh tokens', () => {
    it('Should have a refresh token in a login response', async () => {
        await api.reset();
        const response = await api.login(settings.defaultUsername, settings.defaultPassword, settings.adminClientId, settings.adminClientSecret);
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.include.keys('refresh_token');
    });

    it('Should be able to refresh a token', async () => {
        await api.reset();
        let response = await api.login(settings.defaultUsername, settings.defaultPassword, settings.adminClientId, settings.adminClientSecret);
        const previousAccessToken = response.body.access_token;
        httpAssert.expectStatusCode(response, 200);
        await delay(1100);
        
        response = await api.refreshToken(response.body.refresh_token, settings.adminClientId, settings.adminClientSecret);
        httpAssert.expectStatusCode(response, 200);

        const publicKey = nconf.get('jwtPublicKey');
        const prevPayload = jwt.verify(previousAccessToken, publicKey, { algorithms: ['RS256'] });
        const newPayload = jwt.verify(response.body.access_token, publicKey, { algorithms: ['RS256'] });
        expect(newPayload.exp).to.be.above(prevPayload.exp);
        
        const http = api.anonymousClient({ 'Authorization': 'Bearer ' + response.body.access_token });
        response = await http.getJson(urls.tenants());
        httpAssert.expectStatusCode(response, 200);
    });
});
