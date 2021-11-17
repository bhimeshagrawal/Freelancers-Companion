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
const flash = require("connect-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const User = require("./models/user");
const Project = require("./models/project");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51JwJKnSFuvwOm214HyYFDvWLu3Z1i9iN6niF53o0pQ55XDiIm3ujVLkczIH3y9BrZZyBq8djfcFHTtJJ6oapccTX00sCaU1a32"
);
const uuid = require("uuid");
const YOUR_DOMAIN = "http://localhost:3000";
const request = require("request");

/*
==========================================
CONFIGURATIONS
==========================================
*/
const PORT = process.env.PORT || 3000;
// mongoose.connect("mongodb://localhost/monkeysingh", function (err) {
//   if (!err) console.log("database connected");
//   else console.log(err);
// });
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
// show project page
app.get("/projects", isLoggedIn, function (req, res) {
  User.findOne({ email: req.user.email })
    .populate("projects")
    .exec(function (err, user) {
      if (err) console.log(err);
      else {
        // console.log(user.projects)
        res.render("projects", { user: user });
      }
    });
});
// create a new project
app.post("/projects", isLoggedIn, function (req, res) {
  if (
    (req.user.subscription == "Basic" && req.user.projects.length < 1) ||
    (req.user.subscription == "Starter" && req.user.projects.length < 10) ||
    req.user.subscription == "Plus"
  ) {
    // get data from form and add to projectList array
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
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
    res.redirect("/projects");
  } else {
    res.redirect("/myaccount");
  }
});
//show accounts page and billing page
app.get("/myaccount", isLoggedIn, function (req, res) {
  // console.log(req.user);
  res.render("myaccount", { userDetails: req.user });
});

// AUTH ROUTES
// show register form
app.get("/register", function (req, res) {
  res.render("register");
});
//handle register logic
app.post("/register", function (req, res) {
  User.find(
    { $or: [{ username: req.body.username }, { email: req.body.email }] },
    function (err, foundUsers) {
      if (foundUsers.length != 0) {
        console.log("email or username already exist");
        res.redirect("/register");
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
            });
            User.register(newUser, req.body.password, function (err, user) {
              if (err) {
                console.log(err);
                return res.render("register");
              }
              passport.authenticate("local")(req, res, function () {
                res.redirect("/myaccount");
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
    successRedirect: "/projects",
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
//function if subs is active
function isLoggedInOnlyForHomePage(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/projects");
  }
  return next();
}
app.post("/create-checkout-session", async (req, res) => {
  if (req.body.lookup_key == "starterplankey")
    var price = "price_1JwUgtSFuvwOm214kNRAlmSZ";
  if (req.body.lookup_key == "basicplankey")
    var price = "price_1JwUhhSFuvwOm214avEYKTCU";
  if (req.body.lookup_key == "plusplankey")
    var price = "price_1JwUidSFuvwOm214y6gkPT8f";
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    payment_method_types: ["card"],
    line_items: [
      {
        price: price,
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    mode: "subscription",
    success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    customer: req.user.stripeId,
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
      if (sub.plan.id == "price_1JwUgtSFuvwOm214kNRAlmSZ") subvalue = "Starter";
      if (sub.plan.id == "price_1JwUhhSFuvwOm214avEYKTCU") subvalue = "Basic";
      if (sub.plan.id == "price_1JwUidSFuvwOm214y6gkPT8f") subvalue = "Plus";
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
    const event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = "whsec_12345";
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
