var express = require("express");
var app = express();
const PORT = process.env.PORT || 5000;

app.set("view engine","ejs");
app.use(express.static("public"));

app.listen(PORT,function(){
    console.log("Server Started at port 5000");
})

app.get("/",function(req,res){
    res.render("home");
})
