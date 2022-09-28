import { RestQuery } from './RestQuery';
import { maybeRunQueryTrigger, Types } from './triggers';

export function find(config, auth, className, restWhere, restOptions, clientSDK, context) {
  // TODO auth
  // enforceRoleSecurity('find', className, auth);
  return maybeRunQueryTrigger(Types.beforeFind, className, restWhere, restOptions, config, auth, context).then(result => {
    restWhere = result.restWhere || restWhere;
    restOptions = result.restOptions || restOptions;
    const query = new RestQuery(config, auth, className, restWhere, restOptions, clientSDK, true, context);
    return query.execute();
  });
}

const classesWithMasterOnlyAccess = [
  '_JobStatus',
  '_PushStatus',
  '_Hooks',
  '_GlobalConfig',
  '_JobSchedule',
  '_Idempotency',
];

function enforceRoleSecurity(method: string, className: string, auth: any) {
  if (className === '_Installation' || !auth.isMaster) {
    if (method === 'delete' || method === 'find') {
      const error = `Clients aren't allowed to perform the ${method} operation on the installation collection.`;
      throw new Error(error);
    }
  }

  if (classesWithMasterOnlyAccess.includes(className) && !auth.isMaster) {
    const error = `Clients aren't allowed to perform the ${method} operation on the ${className} collection.`;
    throw new Error(error);
  }

  if (auth.isReadOnly && ['delete', 'create', 'update'].includes(method)) {
    const error = `read-only masterKey isn't allowed to perform the ${method} operation.`;
    throw new Error(error);
  }
}