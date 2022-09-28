import { StorageAdapter } from '../Adapters/Storage/types';
import { ILocalServerOptions } from '../Options';

export default class DatabaseController {
  adapter: StorageAdapter;
  options: ILocalServerOptions;
  constructor(adapter: StorageAdapter, options: ILocalServerOptions) {
    this.adapter = adapter;
    this.options = options || {} as ILocalServerOptions;
  }
}