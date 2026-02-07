import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuItem } from './menu.schema';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Menu')
@Controller('api/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({
    status: 200,
    description: 'List of all menu items.',
    type: [MenuItem],
  })
  async findAll(): Promise<MenuItem[]> {
    return this.menuService.findAll();
  }
}
