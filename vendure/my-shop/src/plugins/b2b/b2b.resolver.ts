import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';
import { B2BService } from './b2b.service';

@Resolver()
export class B2BResolver {
    constructor(private b2bService: B2BService) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.UpdateCustomer)
    async convertToB2B(
        @Ctx() ctx: RequestContext,
        @Args() args: {
            customerId: string;
            companyName: string;
            taxId: string;
            creditLimit?: number;
        },
    ) {
        return this.b2bService.convertToB2BCustomer(
            ctx,
            args.customerId,
            args.companyName,
            args.taxId,
            args.creditLimit,
        );
    }

    @Query()
    @Allow(Permission.Owner)
    async creditAvailable(@Ctx() ctx: RequestContext) {
        if (!ctx.activeUserId) {
            return 0;
        }
        
        const customer = ctx.activeUserId;
        return this.b2bService.getCreditAvailable(ctx, customer);
    }
}