type Listener = {
  onSend: () => void,
  onMessage: () => void
}

let websocket: WebSocket

export const rsocketCreator = (url: string | URL, {onSend, onMessage}: Listener) => {
  websocket?.close()
  websocket = new WebSocket(url)

  const originalSend = websocket.send
  websocket.send = (data) => {
    onSend();
    originalSend.call(websocket, data);
  }
  const closeHandler = () => {
    websocket.removeEventListener('message', onMessage)
    websocket.removeEventListener('close', closeHandler)
  }

  websocket.addEventListener('message', onMessage)
  websocket.addEventListener('close', closeHandler)
  return websocket
}
