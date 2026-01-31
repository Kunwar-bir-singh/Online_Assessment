import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'users_token',
  schema: 'public',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UsersTokenModel extends Model<UsersTokenModel> {
  @AutoIncrement
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true,
  })
  unqiue_id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  token: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at?: Date;
}
