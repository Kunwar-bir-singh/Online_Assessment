import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { ForeignKey } from 'sequelize-typescript/dist/associations/foreign-key/foreign-key';
import { UsersModel } from './users.model';

@Table({
  tableName: 'orders',
  schema: 'public',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
export class OrdersModel extends Model<OrdersModel> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  order_id?: number;

  @ForeignKey(() => UsersModel)
  @Column({
    type: DataType.INTEGER,
  })
  user_id?: number;

  @Column({
    type: DataType.STRING,
  })
  status?: string;

  @Column({
    type: DataType.STRING,
  })
  total_amount?: number;
}
