const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User') 
const Admin = require('../models/Admin')


const { validateRegisterInput, validateLoginInput } = require('../utils/validators')
let  router = express.Router();

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: 'kathirmass99@gmail.com',
        pass: 'kathir31599',
    },
    secure: true, 
});

router.post('/user/register', async (req,res)=>{

    const register = async () =>{
        const username = req.body.username
        const email = req.body.email
        let password = req.body.password

        const {valid,errors} = validateRegisterInput(username, email, password);

        if(!valid){
            res.send({'error': errors})
        }
        //TODO: Make sure user dose not already exist
        const user = await User.findOne({username})

        if(user){
            errors.general = 'this user name is already taken';
            res.send({"error":errors}) 
        }
        // hash password and create an auth token
        let hashpassword = await bcrypt.hash(password,12);

        const newUser = new User({
            email,
            username,
            password:hashpassword,
            createdAt:new Date().toISOString(),
            active:"true"
        })

        const response = await newUser.save();

        const token = jwt.sign({username:response.username},'secret')

        res.status(200).send({'token':token,'data':response});
    }

    register()
    
})

router.get('/user/login', async (req,res)=>{

    const login = async () =>{
        const username = req.query.username
        let password = req.query.password

        const {errors,valid} = validateLoginInput(username,password);

        if(!valid){
            res.send({'error':errors});
        }
        const user = await User.findOne({username});

        if(!user){
            errors.general='user not found'
            res.send({'error':errors});
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match){
            errors.general = 'Wrong credentials';
            res.send({'error':errors})
        }

        if(user.active === 'true'){
            const token = jwt.sign({username:user.username},'secret')
            res.status(200).send({'token':token,'data':user});
        }
        else{
            errors.general = 'user not able to login'
            res.send({'error': errors})
        }
    }

    login()
    
})



router.post('/admin/register', async (req,res)=>{

    const register = async () =>{
        const username = req.body.username
        const email = req.body.email
        let password = req.body.password

        const {valid,errors} = validateRegisterInput(username, email, password);

        if(!valid){
            res.send({'error': errors})
        }
        //TODO: Make sure user dose not already exist
        const user = await Admin.findOne({username})

        if(user){
            errors.general = "This username is taken"
            res.send({"error": errors}) 
        }
        // hash password and create an auth token
        let hashpassword = await bcrypt.hash(password,12);

        const newUser = new Admin({
            email,
            username,
            password:hashpassword,
            createdAt:new Date().toISOString(),
            admin:"true"
        })

        const response = await newUser.save();

        const token = jwt.sign({username:response.username},'secret')

        res.status(200).send({'token':token,'data':response});

    }

    register()
    
})

router.get('/admin/login', async (req,res)=>{

    const login = async () =>{
        const username = req.query.username
        let password = req.query.password

        const {errors,valid} = validateLoginInput(username,password);

        if(!valid){
            res.send({'error':errors});
        }
        const user = await Admin.findOne({username});

        if(!user){
            errors.general='user not found'
            res.send({'error':errors});
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match){
            errors.general = 'Wrong credentials';
            res.send({'error':errors})
        }

        const token = jwt.sign({username:user.username},'secret')
        res.status(200).send({'token':token,'data':user});
    }

    login()
    
})

router.get('/users',(req,res)=>{
    const errors = {}


    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    User.find((err,data)=>{
                        if(err){
                            res.status(500).send(err)
                        }
                        else{
                            res.status(200).send(data)
                        }
                    })
                }
                fetch_();
            }
        })
    }else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }

})

router.post('/send_mail',(req,res)=>{
    const {to, subject, text } = req.body;
    const errors = {}
    const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;

    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                if(!to.match(regEx)){
                    errors.email = "Email must be valid email address";
                    res.send({'error':errors})
                }
            
            
                const mailData = {
                    from: 'kathirmass99@gmail.com',
                    to: to,
                    subject: subject,
                    text: `${text}`,
                };
            
                transporter.sendMail(mailData, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    res.status(200).send({ message: "Mail send", message_id: info.messageId });
                });
            
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }

    
})


router.put('/user/deactivate',(req,res)=>{
    const {username} = req.body
    const errors = {}

    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    try{
                        await User.updateOne({ username: username }, {
                            active: 'false'
                        })
                
                        res.send({'message':'update successfully'})
                    }catch(e){
                        console.log(e)
                    }
                    
                }
            
                fetch_();
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }


})

router.put('/user/activate',(req,res)=>{
    const {username} = req.body
    const errors = {}
    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    try{
                        await User.updateOne({ username: username }, {
                            active: 'true'
                        })
                
                        res.send({'message':'update successfully'})
                    }catch(e){
                        console.log(e)
                    }
                    
                }
            
                fetch_();
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }

})

router.get('/user/connects',(req,res)=>{
    const username = req.query.username
    const errors = {}
    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    try{
                        const user = await User.findOne({ username })
                        
                        if(!user){
                            errors.general = 'user not found'
                            res.send({'error':errors})
                        }

                        res.send({
                            'username':user.username,
                            '_id': user._id,
                            'connects':user.connects,
                            'email':user.email,
                            'active':user.active
                        })

                    }catch(e){
                        console.log(e)
                    }
                    
                }
            
                fetch_();
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }
})

router.put('/user/connects/add',(req,res)=>{
    const username = req.query.username
    const newuser = req.query.newuser
    const errors = {}

    const bearHeader = req.headers["authorization"]

    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    try{
                        const user = await User.findOne({ username })
                        let new_user = await User.findOne({username:newuser})

                        if(!user){
                            errors.general = 'user not found'
                            res.send({'error':errors})
                        }

                        if(!new_user){
                            errors.general = 'user not found'
                            res.send({'error':errors})
                        }

                        let new_user_data = {
                            'id': new_user._id,
                            'username': new_user.username,
                            'email': new_user.email,
                        }

                        user.connects.push(new_user_data)

                        const response = await user.save();

                        res.send(response)

                    }catch(e){
                        console.log(e)
                    }
                    
                }
            
                fetch_();
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }
})


router.put('/user/connects/remove',(req,res)=>{
    const username = req.query.username
    const newuser = req.query.newuser
    const errors = {}

    const bearHeader = req.headers["authorization"]
    if(typeof bearHeader !== 'undefined'){
        const bearer = bearHeader.split(' ');
        const bearToken = bearer[1];
        
        jwt.verify(bearToken,'secret',(err,data)=>{
            if(err){
                res.send(err)
            }
            else if(data){
                const fetch_ = async () =>{
                    try{
                        const user = await User.findOne({ username })
                        let new_user = await User.findOne({username:newuser})

                        if(!user){
                            errors.general = 'user not found'
                            res.send({'error':errors})
                        }
                        if(!new_user){
                            errors.general = 'user not found'
                            res.send({'error':errors})
                        }

                        var n = user.connects.findIndex(x => x.username === newuser);
                        
                        user.connects.splice(n,1)

                        const response = await user.save();

                        res.send(response)

                    }catch(e){
                        console.log(e)
                    }
                    
                }
            
                fetch_();
            }
        })
    }
    else{
        errors.token = "please give valid token";
        res.send({'error':errors})
    }
})

module.exports = router;