import { uniq } from 'lodash';
import path from 'path';
import { LocalObject } from './types/Local';

const AlwaysSelectedKeys = ['objectId', 'createdAt', 'updatedAt', 'ACL'];

export class RestQuery {
  config: LocalObject;
  auth: any;
  className: string;
  restWhere: LocalObject;
  restOptions: LocalObject;
  clientSDK: any;
  runAfterFind: boolean;
  context: LocalObject;
  response: LocalObject;
  findOptions: LocalObject;
  doCount: boolean;
  includeAll: boolean;
  include: string[][];
  keys: string[];
  excludeKeys: string[];
  redirectKey: string;
  redirectClassName: string;
  constructor(config, auth, className, restWhere = {}, restOptions: LocalObject = {}, clientSDK, runAfterFind = true, context = {}) {
    this.config = config;
    this.auth = auth;
    this.className = className;
    this.restWhere = restWhere;
    this.restOptions = restOptions;
    this.clientSDK = clientSDK;
    this.runAfterFind = runAfterFind;
    this.context = context;
    this.response = null;
    this.findOptions = {};

    // TODO auth
    // if (!this.auth.isMaster) {
    //   if (this.className === '_Session') {
    //     if (!this.auth.user) {
    //       throw new Error('Invalid session token');
    //     }
    //     this.restWhere = {
    //       $and: [
    //         this.restWhere,
    //         {
    //           user: {
    //             __type: 'Pointer',
    //             className: '_User',
    //             objectId: this.auth.id,
    //           }
    //         }
    //       ]
    //     }
    //   }
    // }

    this.doCount = false;
    this.includeAll = false;
    this.include = [];
    // 处理二级以上select字段，放到include中
    let keyForInclude = '';
    if (Object.prototype.hasOwnProperty.call(restOptions, 'keys')) {
      keyForInclude = restOptions.keys;
    }
    if (Object.prototype.hasOwnProperty.call(restOptions, 'excludeKeys')) {
      keyForInclude = ',' + restOptions.excludeKeys;
    }
    if (keyForInclude.length) {
      keyForInclude = keyForInclude.split(',').filter(key => key.split('.').length > 1).map(key => key.slice(0, key.lastIndexOf('.'))).join(',');
      if (keyForInclude.length) {
        if (!restOptions.include || !restOptions.include.length) {
          restOptions.include = keyForInclude;
        } else {
          restOptions.include += `,${keyForInclude}`;
        }
      }
    }

    for (const option in restOptions) {
      switch (option) {
        case 'keys':
          const keys = restOptions.keys.split(',').filter(key => key.length).concat(AlwaysSelectedKeys);
          this.keys = uniq(keys);
          break;
        case 'excludeKeys':
          const excludeKeys = restOptions.excludeKeys.split(',').filter(key => key.length && !AlwaysSelectedKeys.includes(key));
          this.excludeKeys = uniq(excludeKeys);
          break;
        case 'count':
          this.doCount = true;
          break;
        case 'includeAll':
          this.includeAll = true;
          break;
        case 'explain':
        case 'hint':
        case 'distinct':
        case 'pipeline':
        case 'skip':
        case 'limit':
        case 'readPreference':
          this.findOptions[option] = restOptions[option];
          break;
        case 'order':
          const orderFields = restOptions.order.split(',');
          this.findOptions.sort = orderFields.reduce((sortMap, field) => {
            field = field.trim();
            if (field === '$score' || field === '-$score') {
              sortMap.score = { $meta: 'textScore' };
            } else if (field[0] === '-') {
              sortMap[field.slice(1)] = -1;
            } else {
              sortMap[field] = 1;
            }
            return sortMap;
          }, {});
          break;
        case 'include':
          const paths = restOptions.include.split(',');
          if (paths.includes('*')) {
            this.includeAll = true;
            break;
          }
          // 这里获取每个key的include情况['a.b.c', 'e.f'] => { a: true, a.b: true, a.b.c: true, e: true, e.f: true }
          const pathSet = paths.reduce((memo, path) => {
            return path.split('.').reduce((memo, _, index, parts) => {
              memo[parts.slice(0, index + 1).join('.')] = true;
              return memo;
            }, memo);
          }, {});
          // 重构/排序 { a: true, a.b: true, a.b.c: true, e: true, e.f: true } => [[a],[e],[a,b],[e,f],[a,b,c]]
          this.include = Object.keys(pathSet).map(key => key.split('.')).sort((a, b) => a.length - b.length)
          break;
        case 'redirectClassNameForKey':
          this.redirectKey = restOptions.redirectClassNameForKey;
          this.redirectClassName = null;
          break;
        case 'includeReadPreference':
        case 'subqueryReadPreference':
          break;
        default:
          throw new Error('bad option: ' + option);
      }
    }
  }

  runFind(options: LocalObject = {}) {
    if (this.findOptions.limit === 0) {
      this.response = { results: [] };
      return Promise.resolve();
    }
    const findOptions = Object.assign({}, this.findOptions);
    if (this.keys) {
      findOptions.keys = this.keys.map(key => key.split('.')[0]);
    }
    if (options.op) {
      findOptions.op = options.op;
    }
    return this.config.database.find(this.className, this.restWhere, findOptions, this.auth)
      .then(results => {
        if (this.className === '_User' && !findOptions.explain) {
          for (const result of results) {
            cleanResultAuthData(result);
          }
        }
        // TODO
        // this.config.filesController.expandFilesInObject(this.config, results);
        if (this.redirectClassName) {
          for (const result of results) {
            result.className = this.redirectClassName;
          }
        }
        this.response = { results: results };
      });
  }

  execute(executeOptions?: LocalObject) {
    return Promise.resolve()
      .then(() => {
        // return this.buildRestWhere();
      })
      .then(() => {
        // return this.handleIncludeAll();
      })
      .then(() => {
        // return this.handleExcludeKeys();
      })
      .then(() => {
        return this.runFind(executeOptions);
      })
      .then(() => {
        // return this.runCount();
      })
      .then(() => {
        // return this.handleInclude();
      })
      .then(() => {
        // return this.runAfterFindTrigger();
      })
      .then(() => {
        return this.response;
      });
  };
}

function cleanResultAuthData(result) {
  delete result.password;
  if (result.authData) {
    Object.keys(result.authData).forEach(provider => {
      if (result.authData[provider] === null) {
        delete result.authData[provider];
      }
    });

    if (Object.keys(result.authData).length == 0) {
      delete result.authData;
    }
  }
};