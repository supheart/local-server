export default class PostgresStorageAdapter {
  _collectionPrefix: string;
  constructor({ uri, collectionPrefix = '', databaseOptions = {} }) {
    this._collectionPrefix = collectionPrefix;
  }
}