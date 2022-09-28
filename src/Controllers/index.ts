import loadAdapter from '../Adapters/AdapterLoader';
import PostgresStorageAdapter from '../Adapters/Storage/Postgres/Adapter';
import defaultDefinition from '../defaults';
import { ILocalServerOptions } from '../Options';
import DatabaseController from './DatabaseController';

function getControllers(options: ILocalServerOptions) {
  const databaseController = getDatabaseController(options);
  return {
    databaseController,
  };
}

function getDatabaseController(options: ILocalServerOptions): DatabaseController {
  const { databaseURI, collectionPrefix, databaseOptions } = options;
  let { databaseAdapter } = options;
  const hasDatabaseOption = databaseOptions || (databaseURI && databaseURI !== defaultDefinition.databaseURI) || collectionPrefix !== defaultDefinition.collectionPrefix;
  if (hasDatabaseOption && databaseAdapter) {
    throw new Error('You cannot specify both a databaseAdapter and a databaseURI/databaseOptions/collectionPrefix.')
  } else if (!databaseAdapter) {
    databaseAdapter = getDatabaseAdapter(databaseURI, collectionPrefix, databaseOptions);
  } else {
    databaseAdapter = loadAdapter(databaseAdapter);
  }
  return new DatabaseController(databaseAdapter, options);
}

function getDatabaseAdapter(databaseURI, collectionPrefix, databaseOptions) {
  let protocol;
  try {
    const parsedURI = new URL(databaseURI);
    protocol = parsedURI.protocol?.toLocaleLowerCase();
  } catch (error) {
    console.error('protocol error');
  }
  const options = {
    uri: databaseURI,
    collectionPrefix,
    databaseOptions,
  };

  switch (protocol) {
    case 'postgres':
    case 'postgresql':
      return new PostgresStorageAdapter(options);
    default:
    // TODO mongodb
    // return new MongoStorageAdapter({ ...options, mongoOptions: databaseOptions });
  }
}

export {
  getControllers,
}