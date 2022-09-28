import AppCache from "./caches";

function removeTrailingSlash(str: string) {
  if (!str) return str;
  if (str.endsWith('/')) {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

export class Config {
  _mount: string;
  _applicationId: string;
  allowHeaders?: string[];
  allowOrigin?: string;
  static get(applicationId: string, mount?: string) {
    const cacheInfo = AppCache.get(applicationId);
    if (!cacheInfo) {
      return;
    }

    const config = new Config();
    config.applicationId = applicationId;
    Object.keys(cacheInfo).forEach(key => {
      // TODO DatabaseController
      config[key] = cacheInfo[key];
    });

    config.mount = removeTrailingSlash(mount);
    // TODO SessionExpire and EmailVerify
    return config;
  }

  get mount() {
    return this._mount;
  }
  set mount(newValue) {
    this._mount = newValue;
  }

  get applicationId() {
    return this._applicationId;
  }
  set applicationId(newValue) {
    this._applicationId = newValue;
  }

  static put(serverConfiguration: Record<string, any>) {
    Config.validate(serverConfiguration);
    AppCache.put(serverConfiguration.appId, serverConfiguration);
    // TODO setupPasswordValidator
    return serverConfiguration;
  }
  static validate({
    masterKey,
    maxLimit,
    readOnlyMasterKey,
  }: Record<string, any>) {
    if (masterKey === readOnlyMasterKey) {
      throw new Error('masterKey和readOnlyMasterKey不能一样');
    }
    this.validateMaxLimit(maxLimit);
  }

  static validateMaxLimit(maxLimit: number): void {
    if (maxLimit <= 0) {
      throw new Error('Max limit must be a value greater than 0.');
    }
  }
}

export default Config;
module.exports = Config;