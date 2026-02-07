import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './orders.schema';
import { MenuItem } from '../menu/menu.schema';
import { SocketService } from './socket.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderModelStr: any;
  let menuItemModel: any;
  let socketService: SocketService;

  const mockMenuItem = {
    _id: new Types.ObjectId('64c9e13e8b0f3e6a12345678'),
    name: 'Test Pizza',
    price: 15.0,
    image_url: 'http://test.com/pizza.jpg',
  };

  const mockOrder = {
    _id: new Types.ObjectId('64c9e13e8b0f3e6a87654321'),
    customer_name: 'John Doe',
    status: 'order_received',
    total_amount: 30.0,
    items: [
      {
        menu_item_id: mockMenuItem._id,
        quantity: 2,
        unit_price: 15.0,
      },
    ],
    save: jest.fn().mockResolvedValue({
      toObject: () => ({ ...mockOrder, _id: mockOrder._id }),
    }),
    toObject: () => ({ ...mockOrder, _id: mockOrder._id }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(MenuItem.name),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: SocketService,
          useValue: {
            emitOrderStatusUpdate: jest.fn(),
            broadcastOrderUpdateToAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderModelStr = module.get(getModelToken(Order.name));
    menuItemModel = module.get(getModelToken(MenuItem.name));
    socketService = module.get<SocketService>(SocketService);

    // Mock orderModel constructor
    class MockOrderModel {
      constructor(dto: any) {
        return mockOrder;
      }
      static find = jest.fn();
      static findOne = jest.fn();
      static findById = jest.fn();
    }
    // Trick to mock the class constructor injected via @InjectModel
    service['orderModel'] = MockOrderModel as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order with calculated price from DB', async () => {
      const createOrderDto: CreateOrderDto = {
        customer_name: 'John Doe',
        customer_address: '123 Main St',
        customer_phone: '555-1234',
        idempotency_key: 'unique-key-1',
        items: [
          {
            menu_item_id: mockMenuItem._id.toString(),
            quantity: 2,
            // @ts-ignore
            unit_price: 999, // Frontend sending wrong price
          },
        ],
      };

      menuItemModel.find.mockResolvedValue([mockMenuItem]);
      // Mock findOne to return null (no existing order with idempotency key)
      service['orderModel'].findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      // We need to spy on the constructor or the save method
      // Since we mocked the class above, 'mockOrder.save' is what we check
      const result = await service.create(createOrderDto);

      expect(menuItemModel.find).toHaveBeenCalled();
      // The total should be 2 * 15.0 = 30.0, NOT 999
      expect(result.total_amount).toBe(30.0);
      expect(result.items[0].unit_price).toBe(15.0);
    });

    it('should return existing order if idempotency key exists', async () => {
         const createOrderDto: CreateOrderDto = {
        customer_name: 'John Doe',
        customer_address: '123 Main St',
        customer_phone: '555-1234',
        idempotency_key: 'existing-key',
        items: [],
      };

      const existingOrderMock = {
          ...mockOrder,
          idempotency_key: 'existing-key',
          toObject: () => ({ ...mockOrder, idempotency_key: 'existing-key', _id: mockOrder._id })
      };

      service['orderModel'].findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingOrderMock)
      });

      const result = await service.create(createOrderDto);
      expect(result.id).toBe(mockOrder._id.toString());
      // Should not call menu item find or create new order
      expect(menuItemModel.find).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if menu item not found', async () => {
      const createOrderDto: CreateOrderDto = {
        customer_name: 'John Doe',
        customer_address: '123 Main St',
        customer_phone: '555-1234',
        idempotency_key: 'unique-key-2',
        items: [
          {
            menu_item_id: new Types.ObjectId().toString(),
            quantity: 1,
          },
        ],
      };

       service['orderModel'].findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      menuItemModel.find.mockResolvedValue([]);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status for valid transition', async () => {
        const orderId = mockOrder._id.toString();
        // Setup findById to return a document with status 'order_received'
        // We need a proper mongoose document mock that includes a save method
        const docMock = {
            ...mockOrder,
            status: 'order_received',
            save: jest.fn().mockImplementation(function() {
                return Promise.resolve(this);
            }),
            toObject: function() { return this; }
        };
        
        service['orderModel'].findById = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(docMock)
        });

        const result = await service.updateStatus(orderId, { status: 'preparing' });

        expect(docMock.status).toBe('preparing');
        expect(docMock.save).toHaveBeenCalled();
        expect(result.status).toBe('preparing');
    });

    it('should throw BadRequestException for invalid transition (skipping step)', async () => {
        const orderId = mockOrder._id.toString();
        const docMock = {
            ...mockOrder,
            status: 'order_received',
            save: jest.fn(),
            toObject: function() { return this; },
            exec: jest.fn().mockResolvedValue(this)
        };

        service['orderModel'].findById = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(docMock)
        });

      await expect(
        service.updateStatus(orderId, { status: 'delivered' }),
      ).rejects.toThrow(BadRequestException);
    });
    
    it('should throw BadRequestException for invalid transition (going backwards)', async () => {
        const orderId = mockOrder._id.toString();
        const docMock = {
            ...mockOrder,
            status: 'out_for_delivery',
            save: jest.fn(),
            toObject: function() { return this; }
        };

        service['orderModel'].findById = jest.fn().mockReturnValue({
             exec: jest.fn().mockResolvedValue(docMock)
        });

      await expect(
        service.updateStatus(orderId, { status: 'preparing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if order not found', async () => {
       service['orderModel'].findById = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null)
       });

      await expect(
        service.updateStatus('some-id', { status: 'preparing' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('concurrency', () => {
    it('should handle concurrent requests with the same idempotency key by returning the same promise', async () => {
      const createOrderDto: CreateOrderDto = {
        customer_name: 'Concurrent User',
        customer_address: '123 Main St',
        customer_phone: '555-1234',
        idempotency_key: 'concurrent-key',
        items: [
          {
            menu_item_id: mockMenuItem._id.toString(),
            quantity: 1,
            // @ts-ignore
            unit_price: 15.0,
          },
        ],
      };

      // Mock menu item found
      menuItemModel.find.mockResolvedValue([mockMenuItem]);

      // Mock existing order check (initially not found)
      service['orderModel'].findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // We want to simulate a delay in processing to ensure overlap
      // We'll mock the 'save' method of the created order to delay
      // To do this, we need to intercept the new this.orderModel() call
      // or just delay the whole thing.
      // Since we mocked 'orderModel' class in beforeEach, let's adjust it for this test.

      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });

      // Mock the order instance save method to wait for our signal
      const mockOrderInstance = {
        save: jest.fn().mockImplementation(async () => {
          await savePromise; // Wait until we manually resolve
          return {
            ...mockOrder,
            toObject: () => ({ ...mockOrder }),
          };
        }),
      };

      // Override the constructor mock for this test
      class MockOrderModelDelayed {
        constructor(dto: any) {
          return mockOrderInstance;
        }
        static findOne = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null)
        });
      }
      service['orderModel'] = MockOrderModelDelayed as any;


      // Fire two requests concurrently
      const req1 = service.create(createOrderDto);
      const req2 = service.create(createOrderDto);

      // They should both be pending
      // resolve the save
      // @ts-ignore
      resolveSave();

      const [res1, res2] = await Promise.all([req1, req2]);

      // Both should return success
      expect(res1).toBeDefined();
      expect(res2).toBeDefined();

      // IMPORTANT: They should be the EXACT same object reference if we returned the promise
      // or at least have the same values.
      // Since mapOrderToResponseJson creates a new DTO, strict reference equality might fail
      // if the promise resolved and the second await got the result.
      // However, we stored the PROMISE. So both awaits await the SAME promise.
      // So the result reference might be identical if the processor returns a specific object.
      // Let's check values at least.
      expect(res1.id).toBe(res2.id);

      // Verify that the processing logic (save) was only called ONCE
      expect(mockOrderInstance.save).toHaveBeenCalledTimes(1);
    });
  });
  describe('findAllAdmin', () => {
    it('should return paginated results with cursor', async () => {
      const mockOrders = [
        { ...mockOrder, _id: new Types.ObjectId(), updatedAt: new Date('2024-01-02') },
        { ...mockOrder, _id: new Types.ObjectId(), updatedAt: new Date('2024-01-01') },
      ];
      // Mock mongoose find chain
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders.map(o => ({
            ...o,
            toObject: () => o
        }))),
      };
      service['orderModel'].find = jest.fn().mockReturnValue(mockFind);

      const result = await service.findAllAdmin({ limit: 1 });

      expect(service['orderModel'].find).toHaveBeenCalledWith({});
      // Since we mocked returning 2 items but requested limit 1, it should have a nextCursor
      expect(result.items.length).toBe(1); // Service slices the extra item
      expect(result.nextCursor).toBeDefined();
      expect(result.limit).toBe(1);
    });
  });
});

