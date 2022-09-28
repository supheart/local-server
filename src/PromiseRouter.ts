import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import Layer from 'express/lib/router/layer';
import { METHOD_TYPES } from './global/constant';

type HandleFunction = (req: ExpressRequest) => Promise<{ response: any }>;

export interface RouteType {
  method: string;
  path: string;
  handler: HandleFunction;
  layer?: any;
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

  route(method: MethodType, path: string, ...handlers: any[]) {
    switch (method) {
      case METHOD_TYPES.POST:
      case METHOD_TYPES.GET:
      case METHOD_TYPES.PUT:
      case METHOD_TYPES.DELETE:
        break;
      default:
        throw 'cannot route method: ' + method;
    }

    let handler = handlers[0];
    if (handlers.length > 1) {
      handler = function (req) {
        return handlers.reduce((promise, handler) => {
          return promise.then(() => {
            return handler(req);
          })
        }, Promise.resolve())
      }
    }

    this.routes.push({
      path,
      method,
      handler,
      layer: new Layer(path, null, handler),
    });
  }

  mountOnto(expressApp) {
    this.routes.forEach(route => {
      const method = route.method.toLowerCase();
      const handler = makeExpressHandler(this.appId, route.handler);
      expressApp[method].call(expressApp, route.path, handler);
    });
    return expressApp;
  }

  expressRouter() {
    return this.mountOnto(express.Router());
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
