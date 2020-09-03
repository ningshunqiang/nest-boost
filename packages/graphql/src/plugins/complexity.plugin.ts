import { HttpException, Logger } from "@nestjs/common";
import { GraphQLSchemaHost, Plugin } from "@nestjs/graphql";
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from "apollo-server-plugin-base";
import {
  directiveEstimator,
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from "graphql-query-complexity";

const maxComplexity = 1000;

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(
    readonly gqlSchemaHost: GraphQLSchemaHost,
    readonly logger: Logger
  ) {
    return this;
  }

  requestDidStart(): GraphQLRequestListener {
    const { schema } = this.gqlSchemaHost;

    return {
      didResolveOperation: ({ request, document }) => {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            directiveEstimator({
              name: "complexity",
            }),
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });

        if (complexity >= maxComplexity) {
          throw new HttpException(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
            429
          );
        }

        this.logger.log(
          { operationName: request.operationName, complexity },
          "query complexity"
        );
      },
    };
  }
}
