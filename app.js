//installing the packages
var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    passport       = require("passport"),
    cookieParser   = require("cookie-parser"),
    LocalStrategy  = require("passport-local"),
    flash          = require("connect-flash"),
    session        = require("express-session"),
    methodOverride = require("method-override"),
    request        = require("request"),
    apiKey         = "f1e0f999122f692de81fc8ede3be89a0",
    apiToken       = "c8a5a4506b6496da9691b124497869213f027d9ad4d8d89cbee079cc3edee318",
    boardId        = "5fcd8e3b73ed780e1b520d51",
    pendingListId  = "618e3cadf3c7b72e9b5438ca",
    activeListId   = "618e4d1b292998103df01f9b";


//configurations
const PORT = process.env.PORT || 3000;
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
    var projectList = [];
    var url = `https://api.trello.com/1/boards/5fcd8e3b73ed780e1b520d51/cards?key=f1e0f999122f692de81fc8ede3be89a0&token=c8a5a4506b6496da9691b124497869213f027d9ad4d8d89cbee079cc3edee318`
    request.get(url, function (err, response, body) {
        if (!err)
        {
             projectList = JSON.parse(body);
             console.log(projectList);
        }
        else
            console.log(err)
    })
    res.render("projects",{projectList : projectList});
})

// create a new card 
app.post("/projects", function(req, res){
    // get data from form and add to projectList array
    var projectTitle = req.body.projectTitle;
    var category = req.body.category;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + '/' + mm + '/' + yyyy;
    var newProject = {
        title: projectTitle,  
        category: category, 
        orderedDate: today,
        estimatedDate: "",
        completedDate: ""
    }
    var postApiLink = `https://api.trello.com/1/cards?key=${apiKey}&token=${apiToken}&idList=${pendingListId}&name=${projectTitle}&desc=${category}`
    console.log(postApiLink)
    request.post(postApiLink);
    res.redirect("/projects");
});


