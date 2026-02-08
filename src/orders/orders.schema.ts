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

  @Prop({ required: true, maxlength: 255 })
  customer_email: string;

  @Prop({ unique: true, sparse: true })
  idempotency_key: string;

  @Prop({
    required: true,
    enum: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    default: 'RECEIVED',
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

// -------------------------------------------------------------------------
// INDEXES
// -------------------------------------------------------------------------

// 1. Unique index for idempotency_key (already created via schema property)
//    Supports: create() - findOne({ idempotency_key })
//    Note: sparse: true allows multiple documents without this field

// 2. Index for email filtering (public order lookup)
//    Supports: findAll(email) - find({ customer_email })
OrderSchema.index({ customer_email: 1 });

// 3. Compound index for email filtering + sorting by creation date
//    Supports: findAll(email) - find({ customer_email }).sort({ createdAt: -1 })
//    MongoDB can use this for both filtering and sorting efficiently
OrderSchema.index({ customer_email: 1, createdAt: -1 });

// 4. Compound index for cursor-based pagination (admin)
//    Supports: findAllAdmin() - complex $or query with updatedAt and _id
//    Query pattern: { $or: [{ updatedAt: { $lt: ... } }, { updatedAt: ..., _id: { $lt: ... } }] }
//    Sort: { updatedAt: -1, _id: -1 }
OrderSchema.index({ updatedAt: -1, _id: -1 });

// 5. Compound index for status simulator background job
//    Supports: startStatusSimulator() - find({ status: { $ne: 'DELIVERED' } }).sort({ createdAt: 1 })
//    Optimizes finding non-delivered orders sorted by creation date
OrderSchema.index({ status: 1, createdAt: 1 });

// 6. Index for general createdAt sorting (when no email filter)
//    Supports: findAll() - find({}).sort({ createdAt: -1 })
OrderSchema.index({ createdAt: -1 });

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});
