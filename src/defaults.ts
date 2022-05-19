import { LocalServerOptions } from "./Options/Definitions";

// 解析默认参数
const DefinitionDefaults = Object.keys(LocalServerOptions).reduce((memo, key) => {
  const def = LocalServerOptions[key];
  if (Object.defineProperty.hasOwnProperty.call(def, 'default')) {
    memo[key] = def.default;
  }
  return memo;
}, {});

export default { ...DefinitionDefaults };
