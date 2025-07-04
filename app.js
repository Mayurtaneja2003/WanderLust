if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

// console.log(process.env.SECRET);
 
const express = require("express");
const app =  express();
const mongoose=require("mongoose");

// const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;


const path = require("path");
const methodOverride = require("method-override");
const ejsMate= require('ejs-mate'); 
const ExpressError = require("./utilis/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");




const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const paymentRouter = require('./routes/payment');


app.set("view engine" ,"ejs");
app.set("views", path.join(__dirname,"/views"));
app.use(express.json());
app.use(express.urlencoded ({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

main()
    .then(()=>{
        console.log("Connected to MongoDB");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main() {
  await mongoose.connect(dbUrl);
}


const store = MongoStore.create({
    mongoUrl:  dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error",()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
    
});

const sessionOptions ={
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,//generlly for security purpose
    }
}


// app.get("/",(req,res)=>{
//     res.send("Hello I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

app.get("/demouser",async (req,res)=>{
    let fakeUser = new User({
        email:"studnet@gmail.com", 
        username: "delta-student",
    });
    let registeredUser= await User.register(fakeUser,"helloworld");
    res.send(registeredUser);
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);
app.use('/payment', paymentRouter);






app.all("*",(req, res,next)=>{
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err,req,res,next)=>{
    let{statusCode=500, message="Something Went Wrong"} = err;
    res.status(statusCode).render("listings/error.ejs", {message});
    // res.status(statusCode).send(message);
});

// Replace your port configuration
const port = process.env.PORT || 3000;

// Update your app.listen
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});