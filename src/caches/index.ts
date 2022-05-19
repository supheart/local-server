import InMemoryCache from "./InMemoryCache";

export const AppCache = new InMemoryCache({ ttl: NaN });
export default AppCache;
