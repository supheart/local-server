import { numberParser, objectParser, moduleOrObjectParser } from './parsers';

const LocalServerOptions = {
  pages: {
    env: 'LOCAL_SERVER_PAGES',
    help: '密码重置和电子邮件验证等页面选项',
    action: objectParser,
    default: {},
  },
  maxLimit: {
    env: 'LOCAL_SERVER_MAX_LIMIT',
    help: '查询的最大条数，默认是无限大',
    action: numberParser('maxLimit'),
    default: Infinity,
  },
  databaseURI: {
    env: 'LOCAL_SERVER_DATABASE_URI',
    help: '数据库连接',
    required: true,
    default: 'postgres://localhost:5432/postgres',
  },
  collectionPrefix: {
    env: 'LOCAL_SERVER_COLLECTION_PREFIX',
    help: '表前缀',
    default: '',
  },
  databaseAdapter: {
    env: 'LOCAL_SERVER_DATABASE_ADAPTER',
    help: '数据库模块',
    action: moduleOrObjectParser,
  },
}

export {
  LocalServerOptions,
}
