import { ConnectionArgs } from "@nest-boost/graphql";
import crypto from "crypto";
import { SelectQueryBuilder } from "typeorm";

export enum PagingType {
  FORWARD = "FORWARD",
  BACKWARD = "BACKWARD",
}

export function getPagingType(connectionArgs: ConnectionArgs): PagingType {
  const { first, last, after, before } = connectionArgs;
  const isForwardPaging = !!first || !!after;
  const isBackwardPaging = !!last || !!before;

  if (isForwardPaging && isBackwardPaging) {
    if ((isForwardPaging && before) || (isBackwardPaging && after)) {
      throw new Error("paging must use either first/after or last/before");
    } else {
      throw new Error(
        "cursor-based pagination cannot be forwards AND backwards"
      );
    }
  }

  return isBackwardPaging ? PagingType.BACKWARD : PagingType.FORWARD;
}

export function parseCursor(
  cursor: string
): { id: string; value: number | string | boolean } {
  if (!cursor) return null;

  let data = null;
  try {
    data = JSON.parse(Buffer.from(cursor, "base64").toString());
  } catch (err) {
    return null;
  }

  return data;
}

export function applyPaginationToQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  connectionArgs: ConnectionArgs
): SelectQueryBuilder<T> {
  const { tableName, columns } = queryBuilder.expressionMap.mainAlias?.metadata;

  const { after, before } = connectionArgs;

  const limit = connectionArgs.first || connectionArgs.last || 0;

  const cursor = parseCursor(after || before);

  queryBuilder.limit(limit + 1);

  const pagingType = getPagingType(connectionArgs);

  if (cursor?.id) {
    const idParameterKey = crypto.randomBytes(4).toString("hex");
    if (pagingType === PagingType.FORWARD) {
      queryBuilder.andWhere(`${tableName}.id > :${idParameterKey}`, {
        [idParameterKey]: cursor.id,
      });
    } else {
      queryBuilder.andWhere(`${tableName}.id < :${idParameterKey}`, {
        [idParameterKey]: cursor.id,
      });
    }
  }

  // 排序
  if (connectionArgs.orderBy) {
    const { field, direction } = connectionArgs.orderBy;
    const column = columns.find((col) => col.propertyName === field);

    if (column) {
      const orderParameterKey = crypto.randomBytes(4).toString("hex");
      queryBuilder.addOrderBy(`${tableName}.${column.databaseName}`, direction);

      if (cursor?.value) {
        queryBuilder.andWhere(
          `${tableName}.${column.databaseName} ${
            direction === "ASC" ? ">=" : "<="
          } :${orderParameterKey}`,
          { [orderParameterKey]: cursor.value }
        );
      }
    }
  }

  // 追加添加 ID 排序
  if (pagingType === PagingType.FORWARD) {
    queryBuilder.addOrderBy(`${tableName}.id`, "ASC");
  } else {
    queryBuilder.addOrderBy(`${tableName}.id`, "DESC");
  }

  return queryBuilder;
}
