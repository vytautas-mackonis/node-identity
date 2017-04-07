import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as _ from 'lodash';

interface ResponseMessage {
    statusCode: number;
    body?: any;
    headers?: { [key: string]: string }
}

interface PromisifiedExpressHandler {
    (req: Request, resp?: Response): Promise<ResponseMessage>;
}

export function expressHandler(handler: PromisifiedExpressHandler): RequestHandler {
    return (req: Request, resp: Response, next: NextFunction) => {
        handler(req, resp)
            .then(result => {
                if (result) {
                    if (result.headers) {
                        //resp.set(result.headers);
                        _.each(result.headers, (v, k) => resp.set(k, v));
                    }

                    resp.status(result.statusCode).send(result.body);
                } else {
                    next();
                }
            })
            .catch(next);
    }
}
