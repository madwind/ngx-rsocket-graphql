type Listener = {
  onSend: () => void,
  onMessage: () => void
}

let websocket: WebSocket

export const rsocketCreator = (url: string | URL, {onSend, onMessage}: Listener) => {
  websocket?.close()
  websocket = new WebSocket(url)
  console.log('new')

  const originalSend = websocket.send
  websocket.send = (data) => {
    onSend();
    originalSend.call(websocket, data);
  }

  const openHandler = () => {
    console.log('open12345')
  }

  const closeHandler = () => {
    websocket.removeEventListener('open', openHandler)
    websocket.removeEventListener('message', onMessage)
    websocket.removeEventListener('close', closeHandler)
  }

  websocket.addEventListener('open', openHandler)
  websocket.addEventListener('message', onMessage)
  websocket.addEventListener('close', closeHandler)
  return websocket
}
