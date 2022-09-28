export interface ILocalServerOptions {
  appId: string;
  masterKey: string;
  serverURL: string;
  databaseURI: string;
  collectionPrefix?: string;
  databaseOptions?: any;
  databaseAdapter?: Object;
}