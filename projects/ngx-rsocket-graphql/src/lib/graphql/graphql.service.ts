import {Injectable} from '@angular/core';

import {RsocketService} from "../rsocket/rsocket.service";
import {GraphqlClient} from "./graphql-client";
import {MutationDocumentNode, QueryDocumentNode, SubscriptionDocumentNode} from "./graphql.type";

@Injectable({
  providedIn: 'root'
})
export class GraphqlService {
  private _graphqlClient: GraphqlClient = {} as any

  constructor(private rsocketService: RsocketService) {
    this._graphqlClient = new GraphqlClient(this.rsocketService.rsocketClient, 'graphql')
  }

  query<T>(query: QueryDocumentNode<T>) {
    return this._graphqlClient.query(query)
  }

  subscription<T>(subscription: SubscriptionDocumentNode<T>) {
    return this._graphqlClient.subscription(subscription)
  }

  mutation<T>(mutation: MutationDocumentNode<T>) {
    return this._graphqlClient.mutation(mutation)
  }
}
