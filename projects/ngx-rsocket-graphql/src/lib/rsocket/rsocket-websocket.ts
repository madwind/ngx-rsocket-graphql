import {deserializeFrame, ErrorCodes, FrameTypes} from 'rsocket-core'

type Listener = {
  onSend: () => void
  onMessage: () => void
  onResumeOk: () => void
  onResumeReject: () => void
}

let websocket: WebSocket

export const rsocketCreator = (url: string | URL, {onSend, onMessage, onResumeOk, onResumeReject}: Listener) => {
  websocket?.close()
  websocket = new WebSocket(url)
  const originalSend = websocket.send
  let resumeTimeout: number

  websocket.send = (data) => {
    //@ts-ignore
    let frame = deserializeFrame(data);
    if (frame.type === FrameTypes.RESUME) {
      resumeTimeout = window.setTimeout(onResumeReject, 5000)
    }
    sendHandler(data)
    websocket.send = sendHandler
  }


  const sendHandler = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    onSend();
    originalSend.call(websocket, data);
  }

  function onFirstMessage(message: MessageEvent) {
    const buffer = Buffer.from(message.data);
    let frame = deserializeFrame(buffer);
    if (frame.type === FrameTypes.ERROR && frame.code === ErrorCodes.REJECTED_RESUME) {
      window.clearTimeout(resumeTimeout)
      onResumeReject()
    }
    if (frame.type === FrameTypes.RESUME_OK) {
      window.clearTimeout(resumeTimeout)
      onResumeOk()
    }
    websocket.removeEventListener('message', onFirstMessage)
  }

  const closeHandler = () => {
    websocket.removeEventListener('message', onMessage)
    websocket.removeEventListener('message', onFirstMessage)
    websocket.removeEventListener('close', closeHandler)
  }

  websocket.addEventListener('message', onMessage)
  websocket.addEventListener('message', onFirstMessage)
  websocket.addEventListener('close', closeHandler)
  return websocket
}
