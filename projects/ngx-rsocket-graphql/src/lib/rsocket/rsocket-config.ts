import {ConnectorConfig} from "rsocket-core";

import {
  encodeBearerAuthMetadata,
  encodeCompositeMetadata,
  encodeRoute,
  encodeSimpleAuthMetadata,
  WellKnownMimeType
} from "rsocket-composite-metadata";
import {Auth} from "./rsocket.type";
import {Buffer} from "buffer";


export class RsocketConfig {
  private config: ConnectorConfig
  private route: string
  private url: string

  constructor(url: string, route = 'route', config: Omit<ConnectorConfig, 'transport'> = {}) {
    this.url = url;
    this.route = route
    this.config = config as ConnectorConfig
    this.payload({})
  }

  payload({data, auth}: { data?: unknown, auth?: Auth }) {
    if (!this.config.setup) {
      this.config['setup'] = {}
    }
    this.config.setup['payload'] = {
      data: data ? Buffer.from(JSON.stringify(data)) : undefined,
      metadata: this.buildAuthMetadata({route: this.route, auth})
    }
    return this
  }

  setAuth(auth: Auth) {
    if (!this.config.setup?.payload?.metadata) {
      throw new Error('must be call payload first')
    }
    this.config.setup.payload.metadata = this.buildAuthMetadata({route: this.route, auth})
  }


  private buildAuthMetadata({route, auth}: { route: string, auth?: Auth }) {
    const map = new Map<WellKnownMimeType, Buffer>();
    map.set(WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, encodeRoute(route))
    if (auth) {
      const {token, simple} = auth
      if (token) {
        map.set(WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeBearerAuthMetadata(token))
      } else if (simple) {
        map.set(WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeSimpleAuthMetadata(simple.username, simple.password))
      }
    }
    return encodeCompositeMetadata(map)
  }

  getUrl() {
    return this.url
  }

  getConfig() {
    return this.config
  }
}
