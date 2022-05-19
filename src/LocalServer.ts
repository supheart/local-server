import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { LocalServerOptions } from './Options';
import requiredParameter from './requiredParameter';
import { allowCrossDomain } from './MiddleWares';
import { getControllers } from './Controllers';
import Config from './Config';
import defaultDefinition from './defaults';
import PagesRouter from './Routers/PagesRouter';
import PublicAPIRouter from './Routers/PublicAPIRouter';

class LocalServer {
  _app!: Express;
  config!: Record<string, any>;
  constructor(options: LocalServerOptions) {
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

    const pageRouter = pages.enableRouter ?
      new PagesRouter(pages).expressRouter() :
      new PublicAPIRouter().expressRouter();

    api.use('/', bodyParser.urlencoded({ extended: false }), pageRouter);

    return api;
  }

  static promiseRouter() { }

  start() { }

  static createLiveQueryServer() { }

  static verifyServerUrl() { }

}

function injectDefaults(options: LocalServerOptions) {
  Object.keys(defaultDefinition).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(options, key)) {
      options[key] = defaultDefinition[key];
    }
  });
}

export default LocalServer;
