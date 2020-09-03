import { ArgsType, Field, Int } from "@nestjs/graphql";
import { ConnectionArguments, ConnectionCursor } from "graphql-relay";

import { Ordering } from "./ordering.input";

@ArgsType()
export class ConnectionArgs implements ConnectionArguments {
  @Field(() => String, { nullable: true })
  before?: ConnectionCursor;

  @Field(() => String, { nullable: true })
  after?: ConnectionCursor;

  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => Int, { nullable: true })
  last?: number;

  @Field(() => Ordering, { nullable: true })
  orderBy?: Ordering;
}
