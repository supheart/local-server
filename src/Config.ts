import AppCache from "./caches";

export class Config {
  _mount: string;
  _applicationId: string;
  allowHeaders?: string[];
  allowOrigin?: string;
  static get(applicationId: string) {
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

    config.mount = null;
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

  static put(serverConfiguration: Record<string, string>) {
    Config.validate(serverConfiguration);
    AppCache.put(serverConfiguration.appId, serverConfiguration);
    // TODO setupPasswordValidator
    return serverConfiguration;
  }
  static validate({
    masterKey,
    readOnlyMasterKey,
  }: Record<string, string>) {
    if (masterKey === readOnlyMasterKey) {
      throw new Error('masterKey和readOnlyMasterKey不能一样');
    }
  }
}

export default Config;
module.exports = Config;