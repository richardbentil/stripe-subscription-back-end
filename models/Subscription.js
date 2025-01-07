import { Schema, model } from 'mongoose';

const SubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    planId: { type: String, required: true },
});

export default model('Subscription', SubscriptionSchema);
