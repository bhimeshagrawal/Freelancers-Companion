/*
==========================================
INSTALLING THE PACKAGES
==========================================
*/

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");
const User = require("./models/user");
const Project = require("./models/project");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51JwJKnSFuvwOm214HyYFDvWLu3Z1i9iN6niF53o0pQ55XDiIm3ujVLkczIH3y9BrZZyBq8djfcFHTtJJ6oapccTX00sCaU1a32"
);
const YOUR_DOMAIN = "http://localhost:3000";
const buildLength = {
  starter: 2,
  basic: 6,
  plus: 25,
};
const priceId = {
  starter: "price_1Jx4D1SFuvwOm214rIu98ukc",
  basic: "price_1Jx4EISFuvwOm2142FiFAS5z",
  plus: "price_1Jx4ExSFuvwOm214oxPLIp9i",
};

/*
==========================================
CONFIGURATIONS
==========================================
*/
const PORT = process.env.PORT || 3000;
mongoose.connect(
  "mongodb+srv://admin:monkeysingh@monkeysingh.ztdvu.mongodb.net/monkeysingh?retryWrites=true&w=majority",
  (err) => {
    if (err) console.log(err);
    else console.log("connected");
  }
);
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(cookieParser("secret"));
//PASSPORT CONFIGURATION
app.use(
  require("express-session")({
    secret: "Monkey singh is best graphic designer",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.listen(PORT, function () {
  console.log(`Server Started at port ${PORT}`);
});

/*
==========================================
ROUTES
==========================================
*/

// show landing page
app.get("/", isLoggedInOnlyForHomePage, function (req, res) {
  res.render("home");
});
function isLoggedInOnlyForHomePage(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  }
  return next();
}

app.get("/pricing", (req, res) => {
  res.render("pricing");
});
// show dashboard page
app.get("/dashboard", isLoggedIn, async function (req, res) {
  // getting users current plan
  const customer = await stripe.customers
    .retrieve(req.user.stripeId, {
      expand: ["subscriptions"],
    })
    .then((sub) => {
      // console.log(sub.subscriptions.data[0].plan);
      var tempPlan = "";
      if (!sub.subscriptions.data[0]) {
        req.user.currentPlan = "";
      } else {
        if (sub.subscriptions.data[0].plan.id == priceId.starter) {
          tempPlan = "Starter";
        } else if (sub.subscriptions.data[0].plan.id == priceId.basic) {
          tempPlan = "Basic";
        } else if (sub.subscriptions.data[0].plan.id == priceId.plus) {
          tempPlan = "Plus";
        } else {
          tempPlan = "";
        }
      }
      User.findOne({ email: req.user.email }, function (err, foundUser) {
        if (err) console.log(err);
        else {
          foundUser.currentPlan = tempPlan;
          foundUser.save(function (err, data) {
            if (err) console.log(err);
          });
        }
      });
    });

  // populating its posts and rendering dashboard
  User.findOne({ email: req.user.email })
    .populate("projects")
    .exec(function (err, user) {
      if (err) console.log(err);
      else {
        res.render("dashboard", { user: user });
      }
    });
});

// create a new project
app.post("/project", isLoggedIn, function (req, res) {
  if (
    (req.user.currentPlan == "Basic" &&
      req.user.projects.length < buildLength.basic) ||
    (req.user.currentPlan == "Starter" &&
      req.user.projects.length < buildLength.starter) ||
    (req.user.currentPlan == "Plus" &&
      req.user.projects.length < buildLength.plus)
  ) {
    // getting todays date
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;

    // get data from form and add to projectList array
    Project.create(
      {
        title: req.body.projectTitle,
        category: req.body.category,
        state: "pending",
        date: today,
        url: "",
      },
      function (err, project) {
        User.findOne({ email: req.user.email }, function (err, foundUser) {
          if (err) console.log(err);
          else {
            foundUser.projects.push(project);
            foundUser.save(function (err, data) {
              if (err) console.log(err);
            });
          }
        });
      }
    );
    res.redirect("/dashboard");
  }
});

// AUTH ROUTES

// show register form and then post to /register
app.get("/register", function (req, res) {
  var err = {
    message: "",
  };
  res.render("register", { err: err });
});
//get data from register page , check for duplicate username and email and create new stripe customer and add it to db
app.post("/register", function (req, res) {
  User.find(
    { $or: [{ username: req.body.username }, { email: req.body.email }] },
    function (err, foundUsers) {
      if (foundUsers.length != 0) {
        var errp = {
          message: "Email or username already exist",
        };
        res.redirect("/register", { err: errp });
      } else {
        var temp = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        };
        //creating user in stripe
        const customer = stripe.customers
          .create({
            description: "My First Test Customer (created for API docs)",
            email: req.body.email,
            name: req.body.username,
            metadata: temp,
          })
          .then((customer) => {
            // console.log(customer);
            //creating user in mongodb database
            var newUser = new User({
              stripeId: customer.id,
              username: customer.name,
              firstName: customer.metadata.firstName,
              lastName: customer.metadata.lastName,
              email: customer.email,
              currentPlan: "",
            });
            User.register(newUser, req.body.password, function (err, user) {
              if (err) {
                console.log(err);
                return res.render("register", { err: err });
              }
              passport.authenticate("local")(req, res, function () {
                res.redirect("/dashboard");
              });
            });
          });
      }
    }
  );
});

// show login form
app.get("/login", function (req, res) {
  res.render("login");
});
// handling login logic
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);
// logout route
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
//check if login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.post("/create-checkout-session", isLoggedIn, async (req, res) => {
  const selectedPrice = {
    price: req.body.price,
    quantity: 1,
  };
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "required",
    allow_promotion_codes: true,
    payment_method_types: ["card"],
    line_items: [selectedPrice],
    phone_number_collection: {
      enabled: true,
    },
    mode: "subscription",
    success_url: `${YOUR_DOMAIN}/`,
    cancel_url: `${YOUR_DOMAIN}/`,
    customer: req.user.stripeId,
  });
  User.findOne({ email: req.user.email }, (err, user) => {
    if (err) console.log(err);
    else {
      user.checkoutSessions.push(session);
      user.save(function (err, user) {
        if (err) console.log(err);
      });
    }
  });
  res.redirect(303, session.url);
});
app.post("/create-portal-session", async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = YOUR_DOMAIN;
  const subscription = await stripe.subscriptions
    .retrieve(checkoutSession.subscription)
    .then((sub) => {
      var subvalue = "";
      if (sub.plan.id == "price_1Jx4D1SFuvwOm214rIu98ukc") subvalue = "Starter";
      if (sub.plan.id == "price_1Jx4EISFuvwOm2142FiFAS5z") subvalue = "Basic";
      if (sub.plan.id == "price_1Jx4ExSFuvwOm214oxPLIp9i") subvalue = "Plus";
      //to do update mongodb
      User.findOne({ email: req.user.email }, (err, user) => {
        if (err) console.log(err);
        else {
          user.subscription = subvalue;
          user.save(function (err, user) {
            if (err) console.log(err);
          });
        }
      });
    });
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    return_url: returnUrl,
  });
  res.redirect(303, portalSession.url);
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    console.log(" i am running");
    console.log(request.body);
    const event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = "whsec_OPYpTXZC9MsHx3u8VoJcj2j6nZRpwQPE";
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription;
    let status;
    // Handle the event
    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

app.get("/customerportal", isLoggedIn, (req, res) => {
  const session = stripe.billingPortal.sessions
    .create({
      customer: req.user.stripeId,
      return_url: YOUR_DOMAIN,
    })
    .then((sessionObject) => res.redirect(sessionObject.url));
});
