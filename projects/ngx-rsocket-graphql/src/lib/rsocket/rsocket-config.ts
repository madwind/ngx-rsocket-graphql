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
  private config: ConnectorConfig = {} as ConnectorConfig
  private setupRoute = 'setup'
  private url

  constructor(url: string) {
    this.url = url;
  }

  setup(setup?: Omit<ConnectorConfig['setup'], 'payload'>) {
    this.config['setup'] = setup ? setup : {}
    return {payload: this.payload}
  }

  private payload(data?: unknown) {
    if (!this.config.setup) {
      throw Error('config lost attr: setup')
    }
    this.config.setup.payload = {
      data: data ? Buffer.from(JSON.stringify(data)) : undefined
    }
    return {route: this.route}
  }

  private route(route: string) {
    if (!this.config.setup?.payload) {
      throw Error('lost attr: payload')
    }
    this.setupRoute = route
    this.config.setup.payload['metadata'] = this.buildAuthMetadata({route: this.setupRoute})
    return {auth: this.auth}
  }

  private auth(auth?: Auth) {
    if (!this.config.setup?.payload?.metadata) {
      throw Error('lost attr: config.setup.payload.metadata')
    }
    this.config.setup.payload.metadata = this.buildAuthMetadata({route: this.setupRoute, auth})
    return {responder: this.responder}
  }


  private fragmentation(fragmentation?: ConnectorConfig['fragmentation']) {
    if (fragmentation) {
      this.config['fragmentation'] = fragmentation
    }
    return {responder: this.responder}
  }

  private responder(responder?: ConnectorConfig['responder']) {
    if (responder) {
      this.config['responder'] = responder
    }
    return {lease: this.lease}
  }

  private lease(lease?: ConnectorConfig['lease']) {
    if (lease) {
      this.config['lease'] = lease
    }
    return {resume: this.resume}
  }

  private resume(resume?: ConnectorConfig['resume']): RsocketConfig {
    if (resume) {
      this.config['resume'] = resume
    }
    return this
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

  setAuth(auth: Auth) {
    this.auth(auth)
  }

  getConfig() {
    return this.config
  }
}
