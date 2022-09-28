import { METHOD_TYPES } from '../global/constant';
import PromiseRouter from '../PromiseRouter';
import { entries } from 'lodash';
import { LocalRequest } from '../types/Local';
import { find } from '../rest';

export class ClassesRouter extends PromiseRouter {
  className(req: LocalRequest) { return req.params.className };

  handleFind(req: LocalRequest) {
    const body = Object.assign(req.body, ClassesRouter.JSONFromQuery(req.query));
    const options = ClassesRouter.optionsFromBody(req.body);
    if (req.config.maxLimit && body.limit > req.config.maxLimit) {
      options.limit = Number(req.config.maxLimit);
    }
    if (body.redirectClassNameForKey) {
      options.redirectClassNameForKey = String(body.redirectClassNameForKey);
    }
    if (typeof body.where === 'string') {
      body.where = JSON.parse(body.where);
    }
    return find(req.config, req.auth, this.className(req), body.where, options, req.info.clientSDK, req.info.context)
      .then(response => ({ response }));
  }

  static JSONFromQuery(query: Record<string, any>): Record<string, any> {
    const json = {};
    for (const [key, value] of entries(query)) {
      try {
        json[key] = JSON.parse(value);
      } catch (e) {
        json[key] = value;
      }
    }
    return json;
  }

  static optionsFromBody(body: any): Record<string, any> {
    const allowConstraints = [
      'skip',
      'limit',
      'order',
      'count',
      'keys',
      'excludeKeys',
      'include',
      'includeAll',
      'redirectClassNameForKey',
      'where',
      'readPreference',
      'includeReadPreference',
      'subqueryReadPreference',
      'hint',
      'explain',
    ];

    for (const key of Object.keys(body)) {
      if (!allowConstraints.includes(key)) {
        throw new Error(`Invalid parameter for query: ${key}`);
      }
    }

    const options = {} as Record<string, any>;
    if (body.skip) {
      options.skip = Number(body.skip);
    }
    return options;
  }

  mountRoutes(): void {
    this.route(METHOD_TYPES.GET, '/classes/:className', req => {
      return this.handleFind(req);
    });
  }
}