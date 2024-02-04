import {deserializeFrame, ErrorCodes, FrameTypes} from 'rsocket-core'

type Listener = {
  onSend: () => void
  onMessage: () => void
  onResumeOk: () => void
  onResumeReject: () => void
  onRejectSetup: () => void
}

let websocket: WebSocket

export const rsocketCreator = (url: string | URL, {
  onSend,
  onMessage,
  onResumeOk,
  onRejectSetup,
  onResumeReject
}: Listener) => {
  websocket?.close()
  websocket = new WebSocket(url)
  const originalSend = websocket.send
  let resumeTimeout: number
  console.log('new')
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
    switch (frame.type) {
      case FrameTypes.ERROR:
        switch (frame.code) {
          case ErrorCodes.REJECTED_SETUP:
            window.clearTimeout(resumeTimeout)
            console.log('reject_setup')
            onRejectSetup()
            break
          case ErrorCodes.REJECTED_RESUME:
            window.clearTimeout(resumeTimeout)
            onResumeReject()
            break
        }
        break;
      case FrameTypes.RESUME_OK:
        window.clearTimeout(resumeTimeout)
        onResumeOk()
        break

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
