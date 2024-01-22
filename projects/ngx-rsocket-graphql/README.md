# NgxRsocketGraphql

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.0.

## connect

```typescript
import {RsocketConfig, RsocketService} from "ngx-rsocket-graphql";

export class AuthService {
  private rsocketService = inject(RsocketService)

  constructor() {
    const config = new RsocketConfig(
      //url
      'ws://localhost:8080/rs',
      //route
      'setup',
      //rsocket connector config(without transport) 
      {
        setup: {
          metadataMimeType: WellKnownMimeType.MESSAGE_RSOCKET_COMPOSITE_METADATA.string,
          dataMimeType: WellKnownMimeType.APPLICATION_JSON.string,
          keepAlive: 60000
        },
        responder: {
          fireAndForget(payload: Payload, responderStream: OnTerminalSubscriber): Cancellable {
            handleFireAndForget(payload)
            return {
              cancel: () => {
              }
            }
          }
        },
        resume: {
          tokenGenerator: () => Buffer.from(nanoid()),
          reconnectFunction: (a) =>
            new Promise((r) => {
              setTimeout(r, 2000, 100)
            }),
        }
      }
    )
      // setup.payload
      .payload({
        auth: {
          simple:
            {username: "username", password: "password"}
        }
      })
    // route 'setup' on server send a data to 'token' when authenticated
    registerRoute<string>({
      route: 'token',
      type: 'string',
      handle: (data) => {
        this.rsocketService.setConnected()
        const token = String(data)
      },
    })

    this.rsocketService.setConfig(config)
    this.rsocketService.connect()
  }
}
```
## graphql query
```typescript
export class UserService {
  constructor(private graphqlService: GraphqlService,) {
    //query
    const me = createQuery<User>(gql`
      query me{
        me {
          id
          name
          subscribes
        }
      }`, 'me')
    this.graphqlService.query(me).subscribe(user => {
      console.log(user)
    })

    //mutation
    const removeUser = (variables: { id: string }) => createMutation<OperationResult>(gql`
      mutation removeUser($id: ID) {
        removeUser(id: $id)
      }`,
      'removeUser',
      variables)
    return this.graphqlService.mutation(removeUser({id: "001"})).subscribe(operationResult => {
      console.log(operationResult)
    })
  }
}
```

