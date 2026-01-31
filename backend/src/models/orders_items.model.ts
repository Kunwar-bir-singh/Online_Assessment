import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { ForeignKey } from 'sequelize-typescript';
import { ProductsModel } from './products.model';
import { OrdersModel } from './orders.model';

@Table({
  tableName: 'order_items',
  schema: 'public',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OrdersItemsModel extends Model<OrdersItemsModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  unique_id?: number;

  @ForeignKey(() => OrdersModel)
  @Column(DataType.INTEGER)
  order_id?: number;

  @BelongsTo(() => OrdersModel, {
    foreignKey: 'order_id',
    as: 'order',
  })
  order?: OrdersModel;

  @ForeignKey(() => ProductsModel)
  @Column(DataType.INTEGER)
  product_id?: number;

  @BelongsTo(() => ProductsModel, {
    foreignKey: 'product_id',
    as: 'product',
  })
  product?: ProductsModel;

  @Column(DataType.INTEGER)
  price_then?: number;

  @Column(DataType.INTEGER)
  quantity?: number;
}
