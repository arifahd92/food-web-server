import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuItem } from './menu.schema';

@Controller('api/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async findAll(): Promise<MenuItem[]> {
    return this.menuService.findAll();
  }
}
