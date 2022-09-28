import { LocalRequest, LocalObject } from "./types/Local";
import { cloneDeep } from 'lodash';

type StoreDataType = {
  Functions: LocalObject;
  Validators: LocalObject;
  Jobs: LocalObject;
  Triggers: LocalObject;
  LiveQuery: LocalObject;
}

export const Types = {
  beforeLogin: 'beforeLogin',
  afterLogin: 'afterLogin',
  afterLogout: 'afterLogout',
  beforeSave: 'beforeSave',
  afterSave: 'afterSave',
  beforeDelete: 'beforeDelete',
  afterDelete: 'afterDelete',
  beforeFind: 'beforeFind',
  afterFind: 'afterFind',
  beforeSaveFile: 'beforeSaveFile',
  afterSaveFile: 'afterSaveFile',
  beforeDeleteFile: 'beforeDeleteFile',
  afterDeleteFile: 'afterDeleteFile',
  beforeConnect: 'beforeConnect',
  beforeSubscribe: 'beforeSubscribe',
  afterEvent: 'afterEvent',
};

const Category = {
  Functions: 'Functions',
  Validators: 'Validators',
  Jobs: 'Jobs',
  Triggers: 'Triggers',
};

const _triggerStore = {};

function baseStore(): StoreDataType {
  const Validators = Object.keys(Types).reduce((base, key) => {
    base[key] = {};
    return base;
  }, {});
  const Triggers = cloneDeep(Validators);
  const Functions = {};
  const Jobs = {};
  const LiveQuery = {};
  return Object.freeze({
    Validators,
    Triggers,
    Functions,
    Jobs,
    LiveQuery,
  });
}

function getStore(category: string, name: string, applicationId: string): StoreDataType {
  const path = name.split('.');
  path.splice(-1); // 去掉最后一个元素
  _triggerStore[applicationId] = _triggerStore[applicationId] || baseStore();
  let store = _triggerStore[applicationId][category];
  for (const component of path) {
    store = store[component];
    if (!store) {
      return undefined;
    }
  }
  return store;
}

function get(category: string, name: string, applicationId: string) {
  const lastComponent = name.split('.').splice(-1); // 这里返回最后一个对象的数组
  const store = getStore(category, name, applicationId);
  return store[lastComponent[0]];
}

export function getTrigger(className: string, triggerType: string, applicationId: string) {
  if (!applicationId) {
    throw new Error('Missing ApplicationID');
  }
  return get(Category.Triggers, `${triggerType}.${className}`, applicationId);
}

export function maybeRunQueryTrigger(triggerType: string, className: string, restWhere: LocalObject, restOptions: LocalObject, config: LocalRequest, auth: any, context: LocalObject, isGet?: boolean) {
  const trigger = getTrigger(className, triggerType, config.applicationId);
  if (!trigger) {
    return Promise.resolve({
      restWhere,
      restOptions,
    });
  }

  return Promise.resolve({
    restWhere,
    restOptions,
  });
  // TODO trigger
}