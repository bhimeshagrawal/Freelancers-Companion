const user = require("./models/user");

//installing the packages
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    passport       = require("passport"),
    mongoose       = require("mongoose")
    cookieParser   = require("cookie-parser"),
    LocalStrategy  = require("passport-local"),
    flash          = require("connect-flash"),
    session        = require("express-session"),
    methodOverride = require("method-override"),
    User           = require("./models/user")
    request        = require("request");


var apiKey         = "f1e0f999122f692de81fc8ede3be89a0",
    apiToken       = "c8a5a4506b6496da9691b124497869213f027d9ad4d8d89cbee079cc3edee318",
    boardId        = "5fcd8e3b73ed780e1b520d51",
    pendingListId  = "618e3cadf3c7b72e9b5438ca",
    completedListId= "618e4d2010bf3e73af71e5f4",
    activeListId   = "618e4d1b292998103df01f9b";

var labelIds = {
    artwork : "618fe7bd8823530b46d1b2f9",
    logo : "",
}

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret : "Monkey singh is best graphic designer",
    resave : false,
    saveUninitialized : false,
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

//configurations
const PORT = process.env.PORT || 3000;
mongoose.connect("mongodb://localhost/monkeysingh",function(err){
    if(!err)
    console.log("database connected")
    else
    console.log(err);
})
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));


// routes
app.listen(PORT,function(){
    console.log(`Server Started at port ${PORT}`);
})
app.get("/",function(req,res){
    res.render("home");
})
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/signup",function(req,res){
    res.render("signup")
})

// list all cards 
app.get("/projects",function(req,res){
    var url = `https://api.trello.com/1/boards/5fcd8e3b73ed780e1b520d51/cards?key=f1e0f999122f692de81fc8ede3be89a0&token=c8a5a4506b6496da9691b124497869213f027d9ad4d8d89cbee079cc3edee318`
    request.get(url, function (err, response, body) {
        if (!err)
        {
             var projectList = JSON.parse(body);
             var projectArray = [];
            //  console.log(projectList);
             projectList.forEach(function(project){
                 if(project.idList == pendingListId) var t = "pending";
                 else if(project.idList == activeListId) var t = "active";
                 else var t = "completed";
                var temp = {
                    name : project.name,
                    date : project.dateLastActivity.substring(0,10),
                    state : t,
                    inviteLink : project.desc,
                    category : project.labels[0].name
                }
                projectArray.push(temp);
            })
            // console.log(projectArray)
            res.render("projects",{projectArray : projectArray});
        }
        else
            console.log(err);
    })
})

// create a new card 
app.post("/projects", function(req, res){
    // get data from form and add to projectList array
    var projectTitle = req.body.projectTitle;
    var category = req.body.category
    if(category == "artwork")
    {
        var categroyLabels = [labelIds.artwork];
        var postApiLink = `https://api.trello.com/1/cards?key=${apiKey}&token=${apiToken}&idList=${pendingListId}&name=${projectTitle}&idLabels=${categroyLabels}`
        request.post(postApiLink);
        res.redirect("/projects");
    }
});

//  ===========
// AUTH ROUTES
//  ===========

// show register form
app.get("/register", function(req, res){
    res.render("register"); 
 });
 //handle sign up logic
 app.post("/register", function(req, res){
     var newUser = new User({
         username: req.body.username,
         firstName : req.body.firstName,
         lastName : req.body.lastName,
         email : req.body.email
        });
     User.register(newUser, req.body.password, function(err, user){
         if(err){
             console.log(err);
             return res.render("register");
         }
         passport.authenticate("local")(req, res, function(){
            res.redirect("/projects"); 
         });
     });
 });
 
 // show login form
 app.get("/login", function(req, res){
    res.render("login"); 
 });

 // handling login logic
 app.post("/login", passport.authenticate("local", 
     {
         successRedirect: "/projects",
         failureRedirect: "/login"
     }), function(req, res){
 });
 
 // logic route
 app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
 });
 
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect("/login");
 }