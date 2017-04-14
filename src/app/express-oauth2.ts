import * as express from 'express';
import * as InvalidArgumentError from 'oauth2-server/lib/errors/invalid-argument-error';
import * as UnauthorizedRequestError from 'oauth2-server/lib/errors/unauthorized-request-error';
const NodeOAuthServer = require('oauth2-server');
const Request = NodeOAuthServer.Request;
const Response = NodeOAuthServer.Response;
import * as promisify from './promisify';

interface ResponseModification {
    (req: express.Request, res: express.Response): void;
}

export class ExpressOAuthServer {
    private server: any;

    constructor(options) {
        this.server = new NodeOAuthServer(options);
    }

    public token : ((r: ResponseModification) => express.RequestHandler) = (applyHeaders) => {
        return promisify.expressHandler(async (req, res) => {
            const request = new NodeOAuthServer.Request(req);
            const response = new NodeOAuthServer.Response(res);

            try {
                const token = await this.server.token(request, response);
                res.locals.oauth = token;
                applyHeaders(req, res);
                token.validate();
                return { statusCode: response.status, body: response.body, headers: response.headers };
            } catch(e) {
                return this.handleError(e, req, res, response);
            }
        });
    }

    public authenticate : (() => express.RequestHandler) = () => {
        return promisify.expressHandler(async (req, res) => {
            const request = new NodeOAuthServer.Request(req);
            const response = new NodeOAuthServer.Response(res);

            try {
                const token = await this.server.authenticate(request, response);
                res.locals['oauth'] = token;
                return null;
            } catch(e) {
                return this.handleError(e, req, res, response);
            }
        });
    }

    private handleError = (e, req, resp, response) => {
        let headers;
        if (response) {
            headers = response.headers;
        }

        if (e instanceof UnauthorizedRequestError) {
            return { statusCode: e.code, headers: headers };
        }

        return { statusCode: e.code, headers: headers, body: { error: e.name, message: e.message }};
    }

}
