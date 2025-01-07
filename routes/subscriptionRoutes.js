import { Router } from 'express';
const router = Router();
import subscription from '../controllers/subscriptionController.js'
import subprotect  from '../middlewares/subscription.js'
import authprotect  from '../middlewares/authMiddleware.js'

const checkForSubscription = subprotect.checkForSubscription
const protect = authprotect.protect

router.use(protect)

const {subscribe, getSubscriptionDetails, getBillingHistory, updateSubscriptionPlan, cancelSubscription, stripeWebhook} = subscription

router.post('/subscribe', subscribe);
router.get('/subscription-details', checkForSubscription, getSubscriptionDetails);
router.get('/billing-history', checkForSubscription, getBillingHistory);
router.patch('/update-subscription', checkForSubscription, updateSubscriptionPlan);
router.delete('/cancel-subscription', checkForSubscription, cancelSubscription);
router.post('/webhook', checkForSubscription, stripeWebhook);

export default router;
