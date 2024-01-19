/*
 * Public API Surface of ngx-rsocket-graphql
 */
import {RsocketConfig} from "./lib/rsocket/rsocket-config";

import {Cancellable, ErrorCodes, OnExtensionSubscriber, Requestable, RSocketError} from "rsocket-core";

import {Buffer} from "buffer";

window.Buffer = Buffer

type StreamRequester = Requestable & Cancellable & OnExtensionSubscriber

export {
  RsocketConfig,
  RSocketError,
  ErrorCodes,
  StreamRequester,
}
export * from './lib/rsocket/rsocket.service';
export * from './lib/rsocket/rsocket-route'
export * from './lib/rsocket/rsocket.type'

export * from './lib/graphql/graphql.service';
export * from './lib/graphql/create-graphql-extractor'
export * from './lib/graphql/graphql.type'
