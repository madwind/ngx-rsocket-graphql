import {Observable} from "rxjs";
import {DocumentNode} from "graphql/language";
import {StreamRequester} from "../../public-api";
import {Payload} from "@rsocket/core";

export type GraphqlSubscribe<T> = {
  result: Observable<T>,
  requester: StreamRequester,
  isCompleted: Observable<boolean>,
  error: Observable<Error>
}

interface DocumentNodeWithExtractor<T, U = any> {
  documentNode: DocumentNode
  extract: (payload: Payload) => T
  variables?: U
}

export interface QueryDocumentNode<T, U = any> extends DocumentNodeWithExtractor<T, U> {
  __typename: 'query';
}

export interface SubscriptionDocumentNode<T, U = any> extends DocumentNodeWithExtractor<T, U> {
  __typename: 'subscription';
}

export interface MutationDocumentNode<T, U = any> extends DocumentNodeWithExtractor<T, U> {
  __typename: 'mutation';
}
