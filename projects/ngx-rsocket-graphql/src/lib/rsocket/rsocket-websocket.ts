import {deserializeFrame, FrameTypes} from 'rsocket-core'

type Listener = {
  onSend: () => void
  onMessage: () => void
  onResumeOk: () => void
}

let websocket: WebSocket

export const rsocketCreator = (url: string | URL, {onSend, onMessage, onResumeOk}: Listener) => {
  websocket?.close()
  websocket = new WebSocket(url)

  const originalSend = websocket.send
  websocket.send = (data) => {
    onSend();
    originalSend.call(websocket, data);
  }

  let firstFrame = true
  function messageHandler(message: MessageEvent) {
    onMessage()
    if (firstFrame) {
      firstFrame = false
      const buffer = Buffer.from(message.data);
      let frame = deserializeFrame(buffer);
      if (frame.type === FrameTypes.RESUME_OK) {
        onResumeOk()
      }
    }
  }

  const closeHandler = () => {
    websocket.removeEventListener('message', messageHandler)
    websocket.removeEventListener('close', closeHandler)
  }

  websocket.addEventListener('message', messageHandler)
  websocket.addEventListener('close', closeHandler)
  return websocket
}
