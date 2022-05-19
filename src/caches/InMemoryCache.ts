const DEFAULT_CACHE_TTL = 5 * 1000;

type RecordType = {
  expire: number;
  value: any;
  timeout?: NodeJS.Timeout;
}

export class InMemoryCache {
  ttl: number; // 毫秒数
  cache: Record<string, RecordType>;
  constructor({ ttl = DEFAULT_CACHE_TTL }) {
    this.ttl = ttl;
    this.cache = Object.create(null);
  }

  get(key): any {
    const record = this.cache[key];
    if (!record) return null;

    // 如果在有效期内，返回需要缓存
    if (isNaN(record.expire) || record.expire >= Date.now()) {
      return record.value;
    }

    // 删除过期的数据
    delete this.cache[key];
    return null;
  }

  put(key, value, ttl = this.ttl): void {
    // 负数/NaN，表示永不过期
    if (ttl < 0 || isNaN(ttl)) {
      ttl = NaN;
    }

    const record: RecordType = {
      value,
      expire: ttl + Date.now(), // NaN + any = NaN
    }

    // 添加定时器，到时间清理过期数据
    if (!isNaN(record.expire)) {
      record.timeout = setTimeout(() => {
        this.del(key);
      }, ttl);
    }

    this.cache[key] = record;
  }

  del(key): void {
    const record = this.cache[key];
    if (!record) return;

    if (record.timeout) {
      clearTimeout(record.timeout);
    }
    delete this.cache[key];
  }

  clear(): void {
    // 这里clear，原来的timeout还是会跑，看看有没有必要清理
    this.cache = Object.create(null);
  }
}

export default InMemoryCache;