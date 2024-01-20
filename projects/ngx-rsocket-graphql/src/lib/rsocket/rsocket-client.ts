import {BehaviorSubject, defer, first, map, ReplaySubject, retry} from "rxjs";
import {ErrorCodes, Payload, RSocket, RSocketConnector, RSocketError} from "rsocket-core";
import {encodeAndAddWellKnownMetadata, encodeRoute, WellKnownMimeType} from "rsocket-composite-metadata";
import {RsocketConfig} from "./rsocket-config";
import {WebsocketClientTransport} from "rsocket-websocket-client";
import {
  ChannelParam,
  ConnectionStatus,
  FireAndForgotParam,
  NetWorkStatus,
  RawPayload,
  ResponseParam,
  StreamParam
} from "./rsocket.type";
import {rsocketCreator} from "./rsocket-websocket";

export class RsocketClient {
  private _rsocketClient = new ReplaySubject<RSocket>(1);
  private _error = new ReplaySubject<Error>(1)
  private _connectionStatus = new BehaviorSubject(ConnectionStatus.DISCONNECTED)
  private _networkStatus = new BehaviorSubject(NetWorkStatus.IDLE)
  private rsocketConfig: RsocketConfig | undefined = undefined

  connect() {
    this._connectionStatus.pipe(first()).subscribe(connectionStatus => {
      if (![ConnectionStatus.REJECT, ConnectionStatus.DISCONNECTED].includes(this._connectionStatus.getValue())) {
        return
      }
      this._connectionStatus.next(ConnectionStatus.CONNECTING)
      if (!this.rsocketConfig) {
        throw new Error("rsocketConfig config is null")
      }
      const config = this.rsocketConfig.getConfig()
      config['transport'] = new WebsocketClientTransport({
        url: this.rsocketConfig.getUrl(),
        wsCreator: (url) => rsocketCreator(url, {
          onSend: () => this._networkStatus.next(NetWorkStatus.UPLOADING),
          onMessage: () => this._networkStatus.next(NetWorkStatus.DOWNLOADING)
        })
      })
      const connector = new RSocketConnector(config)
      defer(() => connector.connect()).pipe(
        retry({delay: 2000})
      ).subscribe({
        next: (rsocketClient) => {
          console.log('Connected to RSocket server');
          rsocketClient.onClose(error => {
            const rsocketError = error as RSocketError
            if (rsocketError) {
              this._error.next(rsocketError)
              if (rsocketError.code === ErrorCodes.REJECTED_SETUP) {
                this._connectionStatus.next(ConnectionStatus.REJECT)
              } else {
                this._connectionStatus.next(ConnectionStatus.DISCONNECTED)
              }
            }
          })
          this._rsocketClient.next(rsocketClient)
        },
        error: error => {
          console.error('Failed to connect to RSocket server', error)
        }
      })
    })

  }

  encodePayload({route, data, encodeData = true}: RawPayload): Payload {
    let dataBuffer: Buffer | null = null
    if (data) {
      if (encodeData) {
        dataBuffer = Buffer.from(JSON.stringify(data))
      } else {
        dataBuffer = Buffer.from(data)
      }
    }
    return {
      data: dataBuffer,
      metadata: encodeAndAddWellKnownMetadata(Buffer.alloc(0), WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, encodeRoute(route))
    }
  }

  fireAndForget({payload}: FireAndForgotParam) {
    this._networkStatus.next(NetWorkStatus.UPLOADING)
    this._rsocketClient.pipe(
      map(rSocket =>
        rSocket.fireAndForget(this.encodePayload(payload), {
          onError: (error: Error) => {
          },
          onComplete: () => {
          }
        })
      ),
      first()
    ).subscribe(() => {
      this._networkStatus.next(NetWorkStatus.IDLE)
    })
  }

  requestResponse({payload, responderStream}: ResponseParam) {
    return this._rsocketClient.pipe(
      map(rSocket =>
        rSocket.requestResponse(this.encodePayload(payload), responderStream)
      ),
      first()
    )
  }

  requestStream({payload, initialRequestN, responderStream}: StreamParam) {
    return this._rsocketClient.pipe(
      map(rSocket => {
          return rSocket.requestStream(this.encodePayload(payload), initialRequestN, responderStream)
        }
      ),
      first()
    )
  }


  requestChannel({payload, initialRequestN, isCompleted, responderStream}: ChannelParam) {
    return this._rsocketClient.pipe(
      map(rSocket =>
        rSocket.requestChannel(this.encodePayload(payload), initialRequestN, isCompleted, responderStream)
      ),
      first()
    )
  }


  get error() {
    return this._error.asObservable()
  }

  setRsocketConfig(rsocketConfig: RsocketConfig) {
    this.rsocketConfig = rsocketConfig
  }
  getRsocketConfig() {
    return this.rsocketConfig
  }

  get connectionStatus() {
    return this._connectionStatus
  }

  updateNetworkState(state: NetWorkStatus) {
    this._networkStatus.next(state)
  }

  get networkStatus() {
    return this._networkStatus.asObservable()
  }

}
