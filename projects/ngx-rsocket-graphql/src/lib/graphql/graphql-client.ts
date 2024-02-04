import {Payload} from "rsocket-core";
import {print} from "graphql/index";
import {RsocketClient} from "../rsocket/rsocket-client";
import {BehaviorSubject, first, map, Observable, ReplaySubject, switchMap} from "rxjs";
import {GraphqlSubscribe, MutationDocumentNode, QueryDocumentNode, SubscriptionDocumentNode} from "./graphql.type";
import {NetWorkStatus} from "../rsocket/rsocket.type";

export class GraphqlClient {
  private rsocketClient: RsocketClient
  private readonly route: string;

  constructor(rsocketClient: RsocketClient, route: string) {
    this.rsocketClient = rsocketClient
    this.route = route
  }

  query<T>(query: QueryDocumentNode<T>) {
    const {documentNode, extract, variables} = query
    const result = new ReplaySubject<T>(1)
    return this.rsocketClient.requestResponse({
      payload: {data: {query: print(documentNode), variables}, route: this.route},
      responderStream: {
        onNext: (payload: Payload, isComplete: boolean) => {
          result.next(extract(payload))
          this.rsocketClient.updateNetworkState(NetWorkStatus.DONE)
        },
        onComplete() {
        },
        onError(error: Error) {
          console.log(error)
        },
        onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean) {
        }
      }
    }).pipe(first(), switchMap(() => result))
  }

  subscription<T>(subscription: SubscriptionDocumentNode<T>): Observable<GraphqlSubscribe<T>> {
    const {documentNode, extract, variables} = subscription
    const result = new ReplaySubject<T>()
    const isCompleted = new BehaviorSubject(false)
    const error = new ReplaySubject<Error>()
    return this.rsocketClient.requestStream({
      payload: {data: {query: print(documentNode), variables}, route: this.route},
      initialRequestN: 1,
      responderStream: {
        onNext: (payload: Payload, isComplete: boolean) => {
          result.next(extract(payload))
        },
        onComplete: () => {
          this.rsocketClient.updateNetworkState(NetWorkStatus.DONE)
        },
        onError(e: Error) {
          error.next(e)
        },
        onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean) {
        }
      }
    }).pipe(map(requester => {
      return {result, requester, isCompleted, error}
    }))
  }

  mutation<T>(mutation: MutationDocumentNode<T>) {
    const {documentNode, extract, variables} = mutation
    const result = new ReplaySubject<T>(1)
    return this.rsocketClient.requestResponse({
      payload: {data: {query: print(documentNode), variables}, route: this.route},
      responderStream: {
        onNext: (payload: Payload, isComplete: boolean) => {
          result.next(extract(payload))
          this.rsocketClient.updateNetworkState(NetWorkStatus.DONE)
        },
        onComplete() {
        },
        onError(error: Error) {
          console.log(error)
        },
        onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean) {
        }
      }
    }).pipe(first(), switchMap(() => result), first())
  }
}
