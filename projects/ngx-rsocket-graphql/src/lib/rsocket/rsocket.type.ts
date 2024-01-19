import {
  Cancellable,
  OnExtensionSubscriber,
  OnNextSubscriber,
  OnTerminalSubscriber,
  Requestable,
  RSocketError
} from "rsocket-core";

export enum ConnectionStatus {
  DISCONNECTED,
  REJECT,
  CONNECTING,
  CONNECTED
}

export enum NetWorkStatus {
  IDLE,
  UPLOADING,
  DOWNLOADING,
  DONE,
}

interface ResumableTransportOption {
  url: string
  resumeToken: string
  reconnectIntervalMillis?: number
}

export interface Auth {
  token?: string
  simple?: {
    username: string
    password: string
  }
}

export interface RawPayload {
  route: string
  data?: any
  encodeData?: boolean
}


export interface FireAndForgotParam {
  payload: RawPayload
}

export interface ResponseParam {
  payload: RawPayload
  responderStream: OnTerminalSubscriber & OnNextSubscriber & OnExtensionSubscriber
}

export interface StreamParam {
  payload: RawPayload
  initialRequestN: number
  responderStream: OnTerminalSubscriber & OnNextSubscriber & OnExtensionSubscriber
}

export interface ChannelParam {
  payload: RawPayload
  initialRequestN: number
  isCompleted: boolean
  responderStream: OnTerminalSubscriber & OnNextSubscriber & OnExtensionSubscriber & Requestable & Cancellable
}

export interface ConnectConfig extends ResumableTransportOption {
  route: string
  dataMimeType?: string
  metadataMimeType?: string
  keepAlive?: number
  lifetime?: number
  data?: unknown
  auth?: Auth
  authHandlers?: {
    tokenHandler: {
      route: string
      handle: (token: string) => void
    },
    errorHandler: (error: RSocketError) => void
  }
}
