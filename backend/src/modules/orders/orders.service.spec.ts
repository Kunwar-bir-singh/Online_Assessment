import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { OrdersService, ORDER_STATUS } from './orders.service';
import { OrdersModel } from 'src/models/orders.model';
import { OrdersItemsModel } from 'src/models/orders_items.model';
import { OrdersStatusModel } from 'src/models/orders_status.model';
import { ProductsModel } from 'src/models/products.model';
import { OrderSseGateway } from './events/order-sse.gateway';
import { Sequelize } from 'sequelize-typescript';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersModel: any;
  let ordersItemsModel: any;
  let ordersStatusModel: any;
  let productsModel: any;
  let orderSseGateway: any;
  let sequelize: any;
  let jwtService: any;

  const mockOrder = {
    order_id: 1,
    user_id: 1,
    status: 'pending',
    total_amount: 50.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    product_id: 1,
    product_name: 'Test Product',
    price: '25.00',
    category: 'pizza',
    image_url: 'http://example.com/image.jpg',
  };

  const mockOrdersModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockOrdersItemsModel = {
    create: jest.fn(),
  };

  const mockOrdersStatusModel = {
    create: jest.fn(),
  };

  const mockProductsModel = {
    findOne: jest.fn(),
  };

  const mockOrderSseGateway = {
    sendToUser: jest.fn(),
    getOrderUpdatesStream: jest.fn(),
  };

  const mockSequelize = {
    transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(OrdersModel),
          useValue: mockOrdersModel,
        },
        {
          provide: getModelToken(OrdersItemsModel),
          useValue: mockOrdersItemsModel,
        },
        {
          provide: getModelToken(OrdersStatusModel),
          useValue: mockOrdersStatusModel,
        },
        {
          provide: getModelToken(ProductsModel),
          useValue: mockProductsModel,
        },
        {
          provide: OrderSseGateway,
          useValue: mockOrderSseGateway,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersModel = module.get(getModelToken(OrdersModel));
    ordersItemsModel = module.get(getModelToken(OrdersItemsModel));
    ordersStatusModel = module.get(getModelToken(OrdersStatusModel));
    productsModel = module.get(getModelToken(ProductsModel));
    orderSseGateway = module.get(OrderSseGateway);
    sequelize = module.get(Sequelize);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOrderDto = {
      items: [{ product_id: 1, quantity: 2 }],
    };

    it('should create an order successfully', async () => {
      // Arrange
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      mockSequelize.transaction.mockResolvedValue(mockTransaction);
      
      mockProductsModel.findOne.mockResolvedValue({
        ...mockProduct,
        get: () => mockProduct,
      });
      
      mockOrdersModel.create.mockResolvedValue({
        ...mockOrder,
        get: () => mockOrder,
      });
      
      mockOrdersItemsModel.create.mockResolvedValue({});
      mockOrdersStatusModel.create.mockResolvedValue({});
      
      // Mock findOne for the return value
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.create(createOrderDto, 1);

      // Assert
      expect(result).toHaveProperty('order_id');
      expect(result).toHaveProperty('user_id', 1);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      mockSequelize.transaction.mockResolvedValue(mockTransaction);
      mockProductsModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createOrderDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders for a user', async () => {
      // Arrange
      const mockOrders = [mockOrder];
      mockOrdersModel.findAll.mockResolvedValue(mockOrders);

      // Act
      const result = await service.findAll(1);

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrdersModel.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: [
          { model: OrdersItemsModel, include: [ProductsModel] },
          { model: OrdersStatusModel },
        ],
        order: [['createdAt', 'DESC']],
      });
    });

    it('should return all orders when no user_id provided', async () => {
      // Arrange
      const mockOrders = [mockOrder];
      mockOrdersModel.findAll.mockResolvedValue(mockOrders);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockOrders);
      expect(mockOrdersModel.findAll).toHaveBeenCalledWith({
        where: {},
        include: [
          { model: OrdersItemsModel, include: [ProductsModel] },
          { model: OrdersStatusModel },
        ],
        order: [['createdAt', 'DESC']],
      });
    });
  });

  describe('findOne', () => {
    it('should return an order by ID', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(mockOrdersModel.findOne).toHaveBeenCalledWith({
        where: { order_id: 1 },
        attributes: ['order_id', 'user_id', 'status', 'total_amount'],
        raw: true,
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithDetails', () => {
    it('should return order with details for authorized user', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findOneWithDetails(1, 1);

      // Assert
      expect(result).toEqual(mockOrder);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(service.findOneWithDetails(1, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneWithDetails(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = { status: 'preparing' };

    it('should update status for authorized user', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValueOnce(mockOrder);
      mockOrdersModel.update.mockResolvedValue([1]);
      mockOrdersStatusModel.create.mockResolvedValue({});
      mockOrdersModel.findOne.mockResolvedValueOnce({
        ...mockOrder,
        status: 'preparing',
      });

      // Act
      const result = await service.updateStatus(1, updateStatusDto, 1);

      // Assert
      expect(result).toHaveProperty('status', 'preparing');
      expect(mockOrderSseGateway.sendToUser).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(
        service.updateStatus(1, updateStatusDto, 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getOrdersStream', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(
        service.getOrdersStream({}, 'invalidToken', '1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if order does not belong to user', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockOrdersModel.findOne.mockResolvedValue({ ...mockOrder, user_id: 2 });

      // Act & Assert
      await expect(
        service.getOrdersStream({}, 'validToken', '1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set SSE headers and stream data for valid request', async () => {
      // Arrange
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
      };
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockOrdersModel.findOne.mockResolvedValue(mockOrder);

      // Act
      await service.getOrdersStream(mockRes, 'validToken', '1');

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockOrderSseGateway.getOrderUpdatesStream).toHaveBeenCalled();
    });
  });
});
