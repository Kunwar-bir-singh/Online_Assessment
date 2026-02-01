import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsModel } from 'src/models/products.model';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsModel: any;

  const mockProduct = {
    product_id: 1,
    product_name: 'Margherita Pizza',
    description: 'Classic Italian pizza with tomato and mozzarella',
    price: '12.99',
    category: 'pizza',
    image_url: 'http://example.com/pizza.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductsModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(ProductsModel),
          useValue: mockProductsModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsModel = module.get(getModelToken(ProductsModel));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const mockProducts = [mockProduct];
      mockProductsModel.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(mockProductsModel.findAll).toHaveBeenCalled();
    });

    it('should return empty array if no products found', async () => {
      // Arrange
      mockProductsModel.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      // Arrange
      mockProductsModel.findByPk.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockProductsModel.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      mockProductsModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      // Arrange
      mockProductsModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(
        'Product with ID 999 not found',
      );
    });
  });
});
