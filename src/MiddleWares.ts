import { Response as ExpressResponse, Request as ExpressRequest, NextFunction } from 'express';
import AppCache from './caches';
import Config from './Config';
import { METHOD_TYPES } from './global/constant';
import { decodeBase64 } from './global/utils';
import { LocalObject } from './types/Local';

export const DEFAULT_ALLOWED_HEADERS =
  'X-Parse-Master-Key, X-Parse-REST-API-Key, X-Parse-Javascript-Key, X-Parse-Application-Id, X-Parse-Client-Version, X-Parse-Session-Token, X-Requested-With, X-Parse-Revocable-Session, X-Parse-Request-Id, Content-Type, Pragma, Cache-Control';

// 允许跨越处理
export function allowCrossDomain(appId) {
  return (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const config = Config.get(appId);
    let allowHeaders = DEFAULT_ALLOWED_HEADERS;
    if (config && config.allowHeaders) {
      allowHeaders += `, ${config.allowHeaders.join(', ')}`;
    }
    const allowOrigin = (config && config.allowOrigin) || '*';
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', allowHeaders);
    res.header('Access-Control-Expose-Headers', 'X-Parse-Job-Status-Id, X-Parse-Push-Status-Id');

    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  };
}

// 处理方法类型覆盖
export function allowMethodOverride(req, _, next) {
  if (req.method === METHOD_TYPES.POST && req.body._method) {
    req.originalMethod = req.method;
    req.method = req.body._method;
    delete req.body._method;
  }
  next();
}

const malformedContext = (res) => {
  res.status(400);
  res.json({ code: 111, error: 'Invalid object for context.' });
}

const invalidRequest = (res) => {
  res.status(403);
  res.end('{"error":"unauthorized"}');
}

const httpAuth = (req) => {
  const header = (req.req || req).headers.authorization;
  if (!header) return;

  let appId: string, masterKey: string, javascriptKey: string;
  const authPrefix = 'basic ';
  if (header.toLowerCase().indexOf(authPrefix) === 0) {
    const encodeAuth = header.substring(authPrefix.length, header.length);
    const credentials = decodeBase64(encodeAuth).split(':');
    if (credentials.length === 2) {
      appId = credentials[0];
      const key = credentials[1];

      const jsKeyPrefix = 'javascript-key=';
      if (key.indexOf(jsKeyPrefix) === 0) {
        javascriptKey = key.substring(jsKeyPrefix.length, key.length);
      } else {
        masterKey = key;
      }
    }
  }
  return { appId, masterKey, javascriptKey };
}

const getMountForRequest = (req) => {
  const mountPathLength = req.originalUrl.length - req.url.length;
  const mountPath = req.originalUrl.slice(0, mountPathLength);
  return `${req.protocol}://${req.get('host')}${mountPath}`;
}

const getClientIp = (req) => {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0];
  } else if (req.connection?.remoteAddress) {
    return req.connection.remoteAddress;
  } else if (req.socket) {
    return req.socket.remoteAddress;
  } else if (req.connection?.socket) {
    return req.connection.socket.remoteAddress;
  } else {
    return req.ip;
  }
}

const HEADER_KEYS = {
  APPLICATION_ID: 'X-Parse-Application-Id',
  SESSION_TOKEN: 'X-Parse-Session-Token',
  MASTER_KEY: 'X-Parse-Master-Key',
  INSTALLATION_ID: 'X-Parse-Installation-Id',
  CLIENT_KEY: 'X-Parse-Client-Key',
  JAVASCRIPT_KEY: 'X-Parse-Javascript-Key',
  WINDOWS_KEY: 'X-Parse-Windows-Key',
  REST_API_KEY: 'X-Parse-REST-API-Key',
  CLIENT_VERSION: 'X-Parse-Client-Version',
  CLOUD_CONTEXT: 'X-Parse-Cloud-Context',
}

// 处理req的参数
export function handleParseHeader(req, res, next) {
  req.body._ApplicationId = 'local-core';
  const mount = getMountForRequest(req);

  let context = {};
  if (req.get(HEADER_KEYS.CLOUD_CONTEXT)) {
    try {
      context = JSON.parse(req.get(HEADER_KEYS.CLOUD_CONTEXT));
      if (Object.prototype.toString.call(context) !== '[object Object]') {
        throw new Error('Context is not an object');
      }
    } catch (error) {
      return malformedContext(res);
    }
  }

  const info = {
    appId: req.get(HEADER_KEYS.APPLICATION_ID),
    sessionToken: req.get(HEADER_KEYS.SESSION_TOKEN),
    masterKey: req.get(HEADER_KEYS.MASTER_KEY),
    installationId: req.get(HEADER_KEYS.INSTALLATION_ID),
    clientKey: req.get(HEADER_KEYS.CLIENT_KEY),
    javascriptKey: req.get(HEADER_KEYS.JAVASCRIPT_KEY),
    dotNetKey: req.get(HEADER_KEYS.WINDOWS_KEY),
    restAPIKey: req.get(HEADER_KEYS.REST_API_KEY),
    clientVersion: req.get(HEADER_KEYS.CLIENT_VERSION),
    context,
  } as LocalObject;

  const basicAuth = httpAuth(req);
  if (basicAuth) {
    const bastAuthAppId = basicAuth.appId;
    if (AppCache.get(bastAuthAppId)) {
      info.appId = bastAuthAppId;
      info.masterKey = basicAuth.masterKey || info.masterKey;
      info.javascriptKey = basicAuth.javascriptKey || info.javascriptKey;
    }
  }
  if (req.body) {
    delete req.body._noBody;
  }
  let fileViaJSON = false;
  // 处理AppId
  if (!info.appId || !AppCache.get(info.appId)) {
    if (req.body instanceof Buffer) {
      try {
        req.body = JSON.parse(req.body);
      } catch (error) {
        return invalidRequest(res);
      }
      fileViaJSON = true;
    }

    const bodyAppId = req.body?._ApplicationId;
    if (bodyAppId && AppCache.get(bodyAppId) && (!info.masterKey || AppCache.get(bodyAppId).masterKey === info.masterKey)) {
      info.appId = bodyAppId;
      info.javascriptKey = req.body._JavascriptKey || '';
      delete req.body._ApplicationId;
      delete req.body._JavascriptKey;

      if (req.body._ClientVersion) {
        info.clientVersion = req.body._ClientVersion
        delete req.body._ClientVersion;
      }
      if (req.body._InstallationId) {
        info.installationId = req.body._InstallationId
        delete req.body._InstallationId;
      }
      if (req.body._SessionToken) {
        info.sessionToken = req.body._SessionToken
        delete req.body._SessionToken;
      }
      if (req.body._MasterKey) {
        info.masterKey = req.body._MasterKey
        delete req.body._MasterKey;
      }
      if (req.body._context) {
        if (req.body._context instanceof Object) {
          info.context = req.body._context;
        } else {
          try {
            info.context = JSON.parse(req.body._context);
            if (Object.prototype.toString.call(info.context) !== '[object Object]') {
              throw new Error('Context is not an object');
            }
          } catch (error) {
            return malformedContext(res);
          }
        }
        delete req.body._context;
      }
      if (req.body._ContentType) {
        req.headers['content-type'] = req.body._Content;
        delete req.body._Content;
      }
    } else {
      return invalidRequest(res);
    }
  }

  if (info.sessionToken && typeof info.sessionToken !== 'string') {
    info.sessionToken = info.sessionToken.toString();
  }
  // TODO client version
  // if (info.clientVersion) {
  //   info.clientSDK = ClientSDK.fromString(info.clientVersion);
  // }
  if (fileViaJSON) {
    req.fileData = req.body.fileData;
    req.body = Buffer.from(req.body.base64, 'base64');
  }
  info.app = AppCache.get(info.appId);
  req.config = Config.get(info.appId, mount);
  req.config.headers = req.headers || {};
  req.config.ip = getClientIp(req);
  req.info = info;

  next();
  // TODO auth
}