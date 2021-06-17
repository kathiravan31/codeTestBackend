const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Cors = require('cors')


//Routes
const Routes = require('./router/route')

app.use(express.json())
app.use(Cors())
app.use(express.Router())
const Port = process.env.PORT || 5000;
const mongodb_url = 'mongodb+srv://kathir_root:kathir_root@cluster0.8nxwb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'


app.use('/api',Routes)


mongoose
    .connect(mongodb_url,{useNewUrlParser:true,useUnifiedTopology:true})
    .then(()=>{
        console.log("Mongo DB Connected");
        return app.listen(Port,()=> console.log(`server running port: ${Port}`));
    })
    
