import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { ForeignKey } from 'sequelize-typescript/dist/associations/foreign-key/foreign-key';
import { ProductsModel } from './products.model';
import { OrdersModel } from './orders.model';

@Table({
  tableName: 'order_items',
  schema: 'public',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class OrdersItemsModel extends Model<OrdersItemsModel> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  unique_id?: number;

  @ForeignKey(() => OrdersModel)
  @Column({
    type: DataType.INTEGER,
  })
  order_id?: number;

  @ForeignKey(() => ProductsModel)
  @Column({
    type: DataType.INTEGER,
  })
  product_id?: number;

  @Column({
    type: DataType.INTEGER,
  })
  price_then?: number;

  @Column({
    type: DataType.INTEGER,
  })
  quantity?: number;
}
