import {Observable, ReplaySubject, shareReplay} from "rxjs";

const cache = new Map<string, Map<string, Observable<any>>>()

interface CacheConfig {
  name: string
}

export function Cacheable(config: CacheConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const cacheKey = JSON.stringify({method: propertyKey, args});
      let cachePart = cache.get(config.name)
      if (!cachePart) {
        cachePart = new Map<string, ReplaySubject<any>>()
        cache.set(config.name, cachePart)
      }
      if (cachePart.has(cacheKey)) {
        return cachePart.get(cacheKey);
      }
      const result = originalMethod.apply(this, args).pipe(shareReplay(1));

      cachePart.set(cacheKey, result);

      return result;
    };
  }
}

