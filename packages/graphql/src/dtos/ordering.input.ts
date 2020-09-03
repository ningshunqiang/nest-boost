import { Field, InputType } from "@nestjs/graphql";

import { OrderDirection } from "../enums/order-direction.enum";

@InputType()
export class Ordering {
  @Field()
  field: string;

  @Field(() => OrderDirection, {
    nullable: true,
    defaultValue: OrderDirection.ASC,
  })
  direction?: OrderDirection;
}
