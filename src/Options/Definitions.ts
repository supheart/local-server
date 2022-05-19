import { objectParser } from './parsers';

const LocalServerOptions = {
  pages: {
    env: 'LOCAL_SERVER_PAGES',
    help: '密码重置和电子邮件验证等页面选项',
    action: objectParser,
    default: {},
  },
}

export {
  LocalServerOptions,
}
