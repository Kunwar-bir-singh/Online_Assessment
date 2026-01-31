import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { UsersModel } from './users.model';
import { OrdersItemsModel } from './orders_items.model';
import { OrdersStatusModel } from './orders_status.model';


@Table({
  tableName: 'orders',
  schema: 'public',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OrdersModel extends Model<OrdersModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  order_id?: number;

  @ForeignKey(() => UsersModel)
  @Column(DataType.INTEGER)
  user_id?: number;

  @BelongsTo(() => UsersModel, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user?: UsersModel;

  @Column(DataType.STRING)
  status?: string;

  @Column(DataType.STRING)
  total_amount?: string;

  @HasMany(() => OrdersItemsModel, {
    foreignKey: 'order_id',
    as: 'items',
  })
  items?: OrdersItemsModel[];

  @HasMany(() => OrdersStatusModel, {
    foreignKey: 'order_id',
    as: 'statuses',
  })
  statuses?: OrdersStatusModel[];
}
