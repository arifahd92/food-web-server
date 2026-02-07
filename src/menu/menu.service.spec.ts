import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { getModelToken } from '@nestjs/mongoose';
import { MenuItem } from './menu.schema';

const mockMenuItemModel = {
  find: jest.fn(),
  exec: jest.fn(),
};

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getModelToken(MenuItem.name),
          useValue: mockMenuItemModel,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
