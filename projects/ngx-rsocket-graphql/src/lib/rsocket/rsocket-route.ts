import {CompositeMetadata, decodeRoutes, WellKnownMimeType} from "rsocket-composite-metadata";
import {Payload} from "rsocket-core";

interface RouteHandle<T = undefined> {
  route: string,
  handle: (data: T) => void
  type?: 'string' | 'json'
}

const routeHandleMap = new Map<string, (data: any) => void>();

function mapMetaData(metadata: any) {
  const mappedMetaData = new Map<string, any>();
  if (metadata) {
    for (let metaData of new CompositeMetadata(metadata)) {
      switch (metaData.mimeType) {
        case  WellKnownMimeType.MESSAGE_RSOCKET_ROUTING.string: {
          const tags = [];
          let routes = decodeRoutes(metaData.content);
          let entry = routes.next()
          while (!entry.done) {
            tags.push(entry.value);
            entry = routes.next()
          }
          const joinedRoute = tags.join(".");
          mappedMetaData.set(WellKnownMimeType.MESSAGE_RSOCKET_ROUTING.string, joinedRoute);
        }
      }
    }
  }
  return mappedMetaData;
}


export function registerRoute<T>({route, type = 'json', handle}: RouteHandle<T>) {
  switch (type) {
    case 'string':
      routeHandleMap.set(route, (payload: Payload) => handle(payload.data?.toString() as T))
      break
    case 'json':
      routeHandleMap.set(route, (payload: Payload) => handle(payload.data as T))
  }
}

export function deleteRoute(route: string | RegExp) {
  if (typeof route === 'string') {
    routeHandleMap.delete(route)
  } else {
    Array.from(routeHandleMap.keys()).forEach(key => {
      if (route.test(key)) {
        routeHandleMap.delete(key)
      }
    })
  }
}

export function handleFireAndForget(payload: Payload) {
  const route = mapMetaData(payload.metadata).get(WellKnownMimeType.MESSAGE_RSOCKET_ROUTING.string)
  const handle = routeHandleMap.get(route);
  if (!handle) {
    console.error(`can not find route for ${route}`)
  } else {
    handle(payload)
  }
}
