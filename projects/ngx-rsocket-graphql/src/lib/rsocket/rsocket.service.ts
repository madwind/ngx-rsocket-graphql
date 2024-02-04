import {Injectable} from '@angular/core';
import {RsocketClient} from "./rsocket-client";
import {RsocketConfig} from "./rsocket-config";
import {Auth, ChannelParam, FireAndForgotParam} from "./rsocket.type";


@Injectable({
  providedIn: 'root'
})
export class RsocketService {
  rsocketClient: RsocketClient;

  constructor() {
    this.rsocketClient = new RsocketClient()
  }

  connect() {
    this.rsocketClient.connect();
  }

  get connectionStatus() {
    return this.rsocketClient.connectionStatus
  }

  get networkStatus() {
    return this.rsocketClient.networkStatus
  }

  fireAndForget(payload: FireAndForgotParam) {
    this.rsocketClient.fireAndForget(payload)
  }

  requestChannel<T>(params: ChannelParam<T>) {
    return this.rsocketClient.requestChannel(params)
  }

  setConfig(config: RsocketConfig) {
    this.rsocketClient.setRsocketConfig(config)
  }

  setAuth(auth: Auth) {
    this.rsocketClient.setAuth(auth)
  }

  setConnected() {
    this.rsocketClient.setConnected()
  }

  get error() {
    return this.rsocketClient.error
  }
}
