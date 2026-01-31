import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { ForeignKey } from 'sequelize-typescript/dist/associations/foreign-key/foreign-key';
import { OrdersModel } from './orders.model';

@Table({
  tableName: 'orders_status',
  schema: 'public',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class OrdersStatusModel extends Model<OrdersStatusModel> {
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

  @Column({
    type: DataType.STRING,
  })
  status?: string;
}
