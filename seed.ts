import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MenuItem } from './src/menu/menu.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

const menuItems = [
  {
    name: 'Margherita Pizza',
    description: 'Classic tomato sauce, mozzarella, fresh basil',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Spicy pepperoni, tomato sauce, mozzarella',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
  },
  {
    name: 'Cheese Burger',
    description: 'Beef patty, cheddar, lettuce, tomato, special sauce',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    name: 'Chicken Burger',
    description: 'Crispy chicken, mayo, pickles, coleslaw',
    price: 10.49,
    image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400',
  },
  {
    name: 'Caesar Salad',
    description: 'Romaine, parmesan, croutons, Caesar dressing',
    price: 8.99,
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
  },
  {
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet, lemon butter sauce, asparagus',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=400',
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Pasta, pancetta, egg, parmesan, black pepper',
    price: 13.99,
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
  },
  {
    name: 'Veggie Wrap',
    description: 'Whole wheat wrap, hummus, roasted vegetables, feta',
    price: 9.49,
    image_url: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=400',
  },
  {
    name: 'Chocolate Cake',
    description: 'Rich chocolate layers, ganache frosting',
    price: 6.99,
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
  },
  {
    name: 'Iced Coffee',
    description: 'Cold brew coffee, milk, sweet cream',
    price: 4.99,
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b5c5090c?w=400',
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const menuItemModel = app.get<Model<MenuItem>>(getModelToken(MenuItem.name));

  console.log('Seeding menu items...');
  for (const item of menuItems) {
    const existing = await menuItemModel.findOne({ name: item.name });
    if (!existing) {
      await menuItemModel.create(item);
      console.log(`Seeded: ${item.name}`);
    } else {
      console.log(`Skipping: ${item.name} (already exists)`);
    }
  }
  console.log('Seeding complete.');
  await app.close();
}

bootstrap();
