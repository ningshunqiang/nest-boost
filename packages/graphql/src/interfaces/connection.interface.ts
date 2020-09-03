import * as Relay from "graphql-relay";

export interface Connection<T> extends Relay.Connection<T> {
  totalCount?: number;
}
