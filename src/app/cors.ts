import regexEscape = require('escape-string-regexp');
import * as _ from 'lodash';
import { Request, Response, RequestHandler } from 'express';

function allowedOriginToRegex(origin: string) {
    const parts = origin.split('*');
    const escaped = _.map(parts, regexEscape);
    return new RegExp('^https?://' + escaped.join('.*') + '/?$');
}

function allowedOriginsToRegex(origins: string) : RegExp[] {
    return _.map(origins.split(','), allowedOriginToRegex);
}

function makeOriginMatcher(allowedOrigin: string) : ((s: string) => boolean) {
    if (allowedOrigin === '*') return origin => true;
    let regexes = allowedOriginsToRegex(allowedOrigin);
    return origin => {
        let result = _.find(regexes, x => x.test(origin));
        return result ? true: false;
    }
}

class CorsHandler {
    private originMatcher: ((s: string) => boolean);
    constructor(allowedOrigin: string) {
        this.originMatcher = makeOriginMatcher(allowedOrigin);
    }

    public clientOriginMatches = (req: Request, resp: Response) => {
        let origin = req.headers.origin;
        if (!this.originMatcher(origin)) return false;
        if (resp.locals.oauth && resp.locals.oauth.client && resp.locals.oauth.client.applicationType === 'Public') {
            let result =  makeOriginMatcher(resp.locals.oauth.client.allowedOrigin)(origin);
            return result;
        }

        return true;
    }

    public preflight : RequestHandler = (req, resp, next) => {
        if (this.originMatcher(req.headers.origin)) {
            let requestedHeaders = req.headers['access-control-request-headers'];
            resp.header('Access-Control-Allow-Headers', requestedHeaders);
            resp.header('Access-Control-Allow-Origin', req.headers.origin);
            resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            resp.header('Access-Control-Allow-Credentials', 'true');
        }

        resp.status(200).end();
    }

    public postflight : RequestHandler = (req, resp, next) => {
        this.clientHandler(req, resp);
        next();
    }

    public clientHandler = (req, resp) => {
        if (!this.clientOriginMatches(req, resp)) return;

        let allowedHeaders = _(req.headers)
            .map((v, k) => k)
            .sort()
            .value()
            .join(', ');
        resp.header('Access-Control-Allow-Headers', allowedHeaders);
        resp.header('Access-Control-Allow-Origin', req.headers.origin);
        resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        resp.header('Access-Control-Allow-Credentials', 'true');
    }
}

export function corsHandler(allowedOrigin: string) {
    return new CorsHandler(allowedOrigin);
}
