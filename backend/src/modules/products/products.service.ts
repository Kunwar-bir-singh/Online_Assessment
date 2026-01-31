import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductsModel } from 'src/models/products.model';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(ProductsModel)
    private productsModel: typeof ProductsModel,
  ) {}

  async findAll(): Promise<ProductsModel[]> {
    return this.productsModel.findAll();
  }

  async findOne(id: number): Promise<ProductsModel> {
    const product = await this.productsModel.findByPk(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
