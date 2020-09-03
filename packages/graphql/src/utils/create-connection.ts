import { Type } from "@nestjs/common";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import * as Relay from "graphql-relay";

import { PageInfo } from "../dtos/page-info.object";
import { Connection } from "../interfaces/connection.interface";

export function createConnection<T>(NodeType: Type<T>): Type<Connection<T>> {
  @ObjectType(`${NodeType.name}Edge`)
  class Edge implements Relay.Edge<T> {
    @Field(() => NodeType)
    node!: T;

    @Field()
    cursor!: Relay.ConnectionCursor;
  }

  @ObjectType({ isAbstract: true })
  class AbstractConnection implements Connection<T> {
    @Field(() => [Edge], { nullable: true })
    edges: Edge[];

    @Field(() => [NodeType], { nullable: true })
    nodes: T[];

    @Field()
    pageInfo: PageInfo;

    @Field(() => Int, { nullable: true })
    totalCount?: number;
  }

  return AbstractConnection;
}
