import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

type HandleFunction = (req: ExpressRequest) => Promise<{ response: any }>;

export interface RouteType {
  method: string;
  path: string;
  handler: HandleFunction;
}

export default class PromiseRouter {
  routes: RouteType[];
  appId: string;
  constructor(routes = [], appId = '') {
    this.routes = routes;
    this.appId = appId;
    this.mountRoutes();
  }

  mountRoutes() { }

  mountOnto(expressApp) {
    this.routes.forEach(route => {
      const method = route.method.toLowerCase();
      const handler = makeExpressHandler(this.appId, route.handler);
      expressApp[method].call(expressApp, route.path, handler);
    });
    return expressApp;
  }

  expressRouter() {
    return this.mountOnto(express.Router);
  }
}

function makeExpressHandler(appId: string, promiseHandler: HandleFunction) {
  return function (req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
    try {
      promiseHandler(req).then(result => {
        res.json(result.response);
      }).catch(e => {
        next(e);
      });
    } catch (e) {
      next(e);
    }
  }
}
