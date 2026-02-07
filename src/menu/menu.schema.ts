import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ required: true, maxlength: 255 })
  name: string;

  @Prop({ default: null })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

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
