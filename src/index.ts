import LocalServer from "./LocalServer";
import { LocalServerOptions } from "./Options";

const _localServer = function (options: LocalServerOptions) {
  const server = new LocalServer(options);
  return server.app;
};

Object.defineProperty(module.exports, 'logger', {
  get: function () {
    return 'log';
  }
});

export default LocalServer;
export {
  _localServer as LocalServer,
};
