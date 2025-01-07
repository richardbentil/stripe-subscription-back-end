
const checkForSubscription = async(req, res, next) => {
    try {
    if(!req.user.stripeCustomerId) return res.status(403).json({ error: "You are not subscribed" });
    next() 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
   
}

export default {checkForSubscription}