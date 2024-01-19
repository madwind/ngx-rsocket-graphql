import {DocumentNode} from "graphql/language";
import {MutationDocumentNode, QueryDocumentNode, SubscriptionDocumentNode} from "./graphql.type";
import {Payload} from "rsocket-core";

enum Operation {
  QUERY = 'query',
  SUBSCRIPTION = 'subscription',
  MUTATION = 'mutation'
}

function create<T, U = any>(documentNode: DocumentNode, extract: string, operation: Operation, variables?: U) {
  const valid = documentNode.definitions.some(definition => {
    //@ts-ignore
    return definition.selectionSet.selections.some(selection => {
      if ("name" in selection && selection.name.value === extract) {
        //@ts-ignore
        if (definition.operation !== operation) {
          throw Error(`createGraphqlExtractor=> '${operation}' type error ${documentNode.loc?.source.body}`)
        }
        return true
      }
      return false
    })
  })
  if (!valid) {
    throw Error(`createGraphqlExtractor=> '${extract}' not in ${documentNode.loc?.source.body}`)
  }

  return {
    documentNode,
    extract: (payload: Payload) => {
      if (!payload.data) {
        throw Error(`GraphqlExtractor => payload.data is null, extract: ${extract}`)
      }
      const value = JSON.parse(payload.data.toString());
      if (value['data'] !== undefined && value['data'][extract] !== undefined) {
        return value['data'][extract] as T
      }
      throw Error(`GraphqlExtractor => 'data' or '${extract}' not in ${JSON.stringify(value)}`)
    },
    variables
  }
}

export function createQuery<T, U = any>(documentNode: DocumentNode, extract: string, variables?: U): QueryDocumentNode<T, U> {
  return create(documentNode, extract, Operation.QUERY, variables) as QueryDocumentNode<T, U>
}

export function createSubscription<T, U = any>(documentNode: DocumentNode, extract: string, variables?: U): SubscriptionDocumentNode<T, U> {
  return create(documentNode, extract, Operation.SUBSCRIPTION, variables) as SubscriptionDocumentNode<T, U>
}

export function createMutation<T, U = any>(documentNode: DocumentNode, extract: string, variables?: U): MutationDocumentNode<T, U> {
  return create(documentNode, extract, Operation.MUTATION, variables) as MutationDocumentNode<T, U>
}
