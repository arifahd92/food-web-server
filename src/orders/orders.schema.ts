import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, maxlength: 255 })
  customer_name: string;

  @Prop({ required: true })
  customer_address: string;

  @Prop({ required: true, maxlength: 50 })
  customer_phone: string;

  @Prop({
    required: true,
    enum: ['order_received', 'preparing', 'out_for_delivery', 'delivered'],
    default: 'order_received',
  })
  status: string;

  @Prop({ required: true, min: 0 })
  total_amount: number;

  @Prop({
    type: [
      {
        menu_item_id: {
          type: MongooseSchema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        unit_price: { type: Number, required: true, min: 0 },
        name: { type: String },
        image_url: { type: String },
      },
    ],
    required: true,
  })
  items: {
    menu_item_id: MongooseSchema.Types.ObjectId;
    quantity: number;
    unit_price: number;
    name?: string;
    image_url?: string;
  }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
