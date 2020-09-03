import { Field, ObjectType } from "@nestjs/graphql";
import * as Relay from "graphql-relay";

@ObjectType()
export class PageInfo implements Relay.PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: Relay.ConnectionCursor;

  @Field({ nullable: true })
  endCursor?: Relay.ConnectionCursor;
}
