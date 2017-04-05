import { Request, Response, NextFunction, RequestHandler } from 'express';

interface ResponseMessage {
    statusCode: number;
    body?: any
}

interface PromisifiedExpressHandler {
    (req: Request): Promise<ResponseMessage>;
}

export function expressHandler(handler: PromisifiedExpressHandler): RequestHandler {
    return (req: Request, resp: Response, next: NextFunction) => {
        handler(req)
            .then(result => resp.status(result.statusCode).send(result.body))
            .catch(next);
    }
}
