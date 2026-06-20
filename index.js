const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
// require model
const Chat=require("./models/chat.js");
const ExpressError=require("./ExpressError");

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

// to parse data from post requestd
app.use(express.urlencoded({extended:true}));
// for method override
app.use(methodOverride("_method"));

main().then(()=>{
    console.log("connection successful");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fakewhatsapp');
}
//Index route
app.get("/chats",asyncWrap(async(req,res)=>{
        let chats= await Chat.find();
        res.render("index.ejs",{chats});
}));
app.get("/",(req,res)=>{
    res.send("root is working");
})

// NEw route
app.get("/chats/new",(req,res)=>{
    // throw new ExpressError(404,"Page not found");
    res.render("new.ejs")
});

// Create route
app.post("/chats",asyncWrap(async(req,res,next)=>{
       let {from,to,msg}=req.body;
        let newChat=new Chat({
            from:from,
            to:to,
            msg:msg,
            created_at:new Date()
        })
        // newChat.save().then((res)=>{
        //     caonsole.log("chat was saved")
        // }).catch((err)=>{
        //     console.log(err);
        // });
        await newChat.save();
        res.redirect("/chats");
}));

// using asyncWrap to handle the error
function asyncWrap(fn){
    return function(req,res,next){
        fn(req,res,next).catch((err)=>next(err));
    };
};

// NEW-Show route
app.get("/chats/:id",asyncWrap(async(req,res,next)=>{
   
        let{id}=req.params;
        
        if(!mongoose.Types.ObjectId.isValid(id)){
            return next(new ExpressError(400,"Invalid Chat ID"));
        }

        let chat=await Chat.findById(id);
        if(!chat){
           next(new ExpressError(404,"Chat not found"));
        }
        res.render("edit.ejs",{chat});
    
}));

// edit route
app.get("/chats/:id/edit",asyncWrap(async(req,res)=>{
        let {id}=req.params;
        let chat=await Chat.findById(id);
        res.render("edit.ejs",{chat});
}));

// update route
app.put("/chats/:id",asyncWrap(async(req,res)=>{
        let {id}=req.params;
        let {msg:newMsg}=req.body;
        console.log(newMsg);
        let updatedChat=await Chat.findByIdAndUpdate(
            id,
            {msg:newMsg},
            {runValidators:true,new:true}
        );
        console.log(updatedChat);
        res.redirect("/chats");
}));


// destroy route
app.delete("/chats/:id",asyncWrap(async(req,res)=>{
        let {id}=req.params;
        let deletedChat=await Chat.findByIdAndDelete(id);
        console.log(deletedChat);
        res.redirect("/chats");
}));


// mongoose error
const handleValidationErr=((err)=>{
    console.log("this was a validation error. Please follow rules");
    console.dir(err.message);
    return err;
})
app.use((err,req,res,next)=>{
    console.log(err.name);
    if(err.name=="ValidationError"){
       err=handleValidationErr(err);
    }
    next(err);
});
// Error handling middleware;
app.use((err,req,res,next)=>{
    let {status=500,message="Some Error Occured"}=err;
    res.status(status).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening on port 8080")
})