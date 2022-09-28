import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { ILocalServerOptions } from './Options';
import requiredParameter from './requiredParameter';
import { allowCrossDomain, allowMethodOverride, handleParseHeader } from './MiddleWares';
import { getControllers } from './Controllers';
import Config from './Config';
import defaultDefinition from './defaults';
import PagesRouter from './Routers/PagesRouter';
import PublicAPIRouter from './Routers/PublicAPIRouter';
import PromiseRouter from './PromiseRouter';
import { ClassesRouter } from './Routers/ClassesRouter';

class LocalServer {
  _app!: Express;
  config!: Record<string, any>;
  constructor(options: ILocalServerOptions) {
    injectDefaults(options);
    const {
      appId = requiredParameter('You must provide an appId!'),
      masterKey = requiredParameter('You must provide a masterKey!'),
      serverURL = requiredParameter('You must provide a serverURL!'),
    } = options;

    const allControllers = getControllers(options);
    this.config = Config.put({ ...options, ...allControllers })
    console.log(appId, masterKey, serverURL);
  }

  get app(): Express {
    if (!this._app) {
      this._app = LocalServer.app(this.config);
    }
    return this._app;
  }

  handleShutdown() { }

  static app(options: Record<string, any>): Express {
    const { appId, pages } = options;
    const api = express();
    api.use(allowCrossDomain(appId));

    //TODO FileRouter

    api.use('/health', (_, res) => {
      res.json({
        status: 'ok',
      });
    });

    // Page router
    const pageRouter = pages.enableRouter ?
      new PagesRouter(pages).expressRouter() :
      new PublicAPIRouter().expressRouter();
    api.use('/', bodyParser.urlencoded({ extended: false }), pageRouter);
    api.use(allowMethodOverride);
    api.use(handleParseHeader);

    // App router
    const appRouter = LocalServer.promiseRouter(appId);
    api.use(appRouter.expressRouter());

    return api;
  }

  static promiseRouter(appId: string): PromiseRouter {
    const routers = [new ClassesRouter()];
    const routes = routers.reduce((memo, router) => memo.concat(router.routes), []);
    const appRouter = new PromiseRouter(routes, appId);

    return appRouter;
  }

  start() { }

  static createLiveQueryServer() { }

  static verifyServerUrl() { }

}

function injectDefaults(options: ILocalServerOptions): void {
  Object.keys(defaultDefinition).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(options, key)) {
      options[key] = defaultDefinition[key];
    }
  });
}

export default LocalServer;
