import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { OrdersModel } from './orders.model';

@Table({
  tableName: 'orders_status',
  schema: 'public',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OrdersStatusModel extends Model<OrdersStatusModel> {
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

  @Column(DataType.STRING)
  status?: string;
}
