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
  private payloadData: unknown = undefined
  private payloadDAuth: Auth | undefined = undefined
  private _url = 'ws://localhost:8080/rs'


  constructor(url: string) {
    this._url = url;
  }

  setup(setup: ConnectorConfig['setup']) {
    this.config['setup'] = setup
    return this
  }

  data(data: unknown) {
    return this.payload(data, this.payloadDAuth)
  }

  auth(auth?: Auth) {
    return this.payload(this.payloadData, auth)
  }

  payload(data: unknown, auth?: Auth, route = 'setup') {
    this.payloadData = data
    this.payloadDAuth = auth
    if (!this.config.setup) {
      throw Error('payload() must after setup()')
    }
    this.config.setup['payload'] = {
      data: data ? Buffer.from(JSON.stringify(data)) : undefined,
      metadata: this.buildAuthMetadata({route, auth})
    }
    return this
  }

  fragmentation(fragmentation: ConnectorConfig['fragmentation']) {
    this.config['fragmentation'] = fragmentation
    return this
  }

  url(url: string) {
    this._url = url
    return this
  }

  getUrl() {
    return this._url
  }

  // transport(transport: ConnectorConfig['transport']) {
  //     this.config['transport'] = transport
  //     return this
  // }

  responder(responder: ConnectorConfig['responder']) {
    this.config['responder'] = responder
    return this
  }

  lease(lease: ConnectorConfig['lease']) {
    this.config['lease'] = lease
    return this
  }

  resume(resume: ConnectorConfig['resume']) {
    this.config['resume'] = resume
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

  build() {
    return this.config
  }
}
