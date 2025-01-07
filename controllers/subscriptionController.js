import dotenv from 'dotenv'
import Stripe from 'stripe'
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { ObjectId } from 'mongodb';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY,
    {
        apiVersion: "2024-12-18.acacia",
    }
);

const subscribe = async (req, res) => {
    const { userId, planId, paymentMethodId } = req.body;

    try {
        // Create Stripe customer
        const customer = await stripe.customers.create({
            payment_method: paymentMethodId,
            email: req.body.email,
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: planId }],
            expand: ['latest_invoice.payment_intent'],
        });

        // Save subscription to database
        await Subscription.create({
            userId,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            planId
        });

        //save stripe customer id
        const user = await User.findById(userId);
        user.stripeCustomerId = customer.id;
        await user.save();

        res.status(200).json({ message: 'Subscribed successfully', subscription });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get Subscription Details
const getSubscriptionDetails = async (req, res) => {
    try {
        const customerId = req.user.stripeCustomerId; // Assume we store this in the user model
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (!subscriptions.data.length) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        const subscri = await Subscription.findOne({stripeCustomerId: customerId})
        
        const subscription = subscriptions.data[0];

       //console.log("sub", subscription.items.data[0])
        res.status(200).json({
            plan: subscription.items.data[0].plan.nickname,
            price: subscription.items.data[0].plan.amount / 100,
            currency: subscription.items.data[0].plan.currency,
            nextBillingDate: new Date(subscription.current_period_end * 1000),
            stripeSubscriptionId: subscri?.stripeSubscriptionId,
            subscriptionItemId: subscription.items.data[0]?.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to fetch subscription details' });
    }
};

const updateSubscriptionPlan = async (req, res) => {
    try {
        const { subscriptionId, newPlanId, subscriptionItemId } = req.body;
        console.log(subscriptionId, newPlanId, subscriptionItemId)
        //check if plan has been changed before updating
       const subscri = await Subscription.findOne({stripeSubscriptionId: subscriptionId})

        if (subscri.updatedPlan) {
            return res.status(400).json({ message: 'You have already upgrade/degraded your plan, it cant be changed again' });
        }

        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscriptionItemId, // You can fetch this via Stripe's subscription object
                    plan: newPlanId,
                },
            ],
        });

        //Save subscription to database
        await Subscription.findOneAndUpdate({userId: new ObjectId(req.user._id)},{
            stripeSubscriptionId: subscriptionId,
            planId: newPlanId,
            updatedPlan: true
        }); 

        res.status(200).json({ message: 'Subscription updated', updatedSubscription });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Unable to update subscription' });
    }
};


const cancelSubscription = async (req, res) => {
    try {
        const subscriptionId = req.body.subscriptionId;

        const canceledSubscription = await stripe.subscriptions.del(subscriptionId);

        res.status(200).json({ message: 'Subscription canceled', canceledSubscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to cancel subscription' });
    }
};

const getBillingHistory = async (req, res) => {
    try {
        const customerId = req.user.stripeCustomerId;

        const charges = await stripe.charges.list({ customer: customerId });

        res.status(200).json(charges.data.map((charge) => ({
            amount: charge.amount / 100,
            currency: charge.currency,
            date: new Date(charge.created * 1000),
            description: charge.description,
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to fetch billing history' });
    }
};

const stripeWebhook = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        return res.status(400).send(`Webhook error: ${error.message}`);
    }

    switch (event.type) {
        case 'invoice.payment_succeeded':
            // Send email notification for successful payment
            break;
        case 'customer.subscription.updated':
            // Send email notification for subscription updates
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
};



export default { subscribe, getSubscriptionDetails, cancelSubscription, updateSubscriptionPlan, getBillingHistory, stripeWebhook };
