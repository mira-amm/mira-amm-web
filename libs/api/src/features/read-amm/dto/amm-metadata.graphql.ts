import {Field, ObjectType} from "@nestjs/graphql";

@ObjectType()
export class AmmFees {
  @Field(() => String)
  lpFeeVolatile: string;

  @Field(() => String)
  lpFeeStable: string;

  @Field(() => String)
  protocolFeeVolatile: string;

  @Field(() => String)
  protocolFeeStable: string;
}

@ObjectType()
export class AmmMetadata {
  @Field(() => String)
  id: string;

  @Field(() => AmmFees)
  fees: AmmFees;

  @Field(() => String)
  hook: string;

  @Field(() => String)
  totalAssets: string;

  @Field(() => String)
  owner: string;
}
