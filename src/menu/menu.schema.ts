import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ timestamps: true })
export class MenuItem {
  @ApiProperty({ example: 'Margherita Pizza', description: 'Name of the menu item' })
  @Prop({ required: true, maxlength: 255 })
  name: string;

  @ApiProperty({ example: 'Classic pizza with tomato and basil', description: 'Description of the item' })
  @Prop({ default: null })
  description: string;

  @ApiProperty({ example: 12.99, description: 'Price in USD' })
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiProperty({ example: 'http://example.com/pizza.jpg', description: 'URL of the item image' })
  @Prop({ default: null, maxlength: 500 })
  image_url: string;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

MenuItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
