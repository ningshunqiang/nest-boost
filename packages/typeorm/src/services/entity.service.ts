import { Connection, QueryConnectionArgs } from "@nest-boost/graphql";
import { Injectable } from "@nestjs/common";
import { applySearchSyntaxToQueryBuilder } from "search-syntax-typeorm";
import {
  FindManyOptions,
  FindOptionsUtils,
  getMetadataArgsStorage,
  Repository,
} from "typeorm";

import {
  applyPaginationToQueryBuilder,
  getPagingType,
  PagingType,
} from "../utils";

@Injectable()
export class EntityService<Entity> {
  constructor(readonly repository: Repository<Entity>) {
    return this;
  }

  async load<PropertyName extends keyof Entity>(
    entity: Entity,
    propertyName: PropertyName & string
  ): Promise<Entity[PropertyName]> {
    const relation = getMetadataArgsStorage().relations.find(
      (item) =>
        item.target === entity.constructor && item.propertyName === propertyName
    );

    if (!relation) {
      throw new Error("Relation is not found.");
    }

    const queryBuilder = this.repository
      .createQueryBuilder()
      .relation(entity.constructor, propertyName)
      .of(entity);

    switch (relation.relationType) {
      case "one-to-many":
      case "many-to-many":
        entity[propertyName] = (await queryBuilder.loadMany()) as any;
        break;
      case "one-to-one":
      case "many-to-one":
        entity[propertyName] = await queryBuilder.loadOne();
        break;
      default:
    }

    return entity[propertyName];
  }

  async getConnection(
    connectionArgs: QueryConnectionArgs,
    options?: FindManyOptions<Entity> | FindManyOptions<Entity>["where"]
  ): Promise<Connection<Entity>> {
    const { tableName } = this.repository.manager.connection.getMetadata(
      this.repository.target
    );

    const queryBuilder = this.repository.createQueryBuilder(tableName);

    // 应用查询选项到查询编译器
    if (options) {
      FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(
        queryBuilder,
        options as FindManyOptions<Entity>
      );
    }

    // 应用分页到查询编译器
    applyPaginationToQueryBuilder(queryBuilder, connectionArgs);

    // 应用搜索语法到查询编译器
    applySearchSyntaxToQueryBuilder(queryBuilder, connectionArgs.query);

    const entities = await queryBuilder.getMany();

    const limit = connectionArgs.first || connectionArgs.last || 0;

    const pagingType = getPagingType(connectionArgs);

    const hasPreviousPage =
      pagingType === PagingType.FORWARD
        ? connectionArgs.first && !!connectionArgs.after
        : connectionArgs.last && !!connectionArgs.before;

    const hasNextPage = entities.length > limit;

    const edges = (hasNextPage ? entities.slice(0, -1) : entities).map(
      (node: Entity & { id: number | string }) => ({
        node,
        cursor: Buffer.from(
          JSON.stringify({
            id: String(node.id),
            ...(connectionArgs?.orderBy?.field
              ? { value: node[connectionArgs.orderBy.field] }
              : {}),
          })
        ).toString("base64"),
      })
    );

    return {
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      edges,
    };
  }
}
