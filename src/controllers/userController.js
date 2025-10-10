const userModal= require("../models/UsersModel.js")
const bcrypt = require("bcrypt")
const jwt= require("jsonwebtoken")
const sessionmodel= require("../models/SessionsModel.js")
const path = require("path")
const multer= require("multer")
const fs = require('fs')
const {ACCESSTOKEN_SECRET,REFRESHTOKEN_SECRET} = require("../../loadenv")
const crypto = require("crypto")
const getRedisClient = require("../redis.js")

const { createUserLService,getUserByEmail, updateUserLService, getBasicUserData, getUserDirectFromDB, isEmailRegistered, deleteUserLService  } = require("../services/others/users-lservice.js")
const {createLoadSession, updateSessionRefreshToken, deleteSessionsBySessionIds, deleteSessionsByUserId,
    fetchTokenData, getBasicSessionsByUserId, getDetailedSessionsByUserId} = require("../services/others/sessions-lservice.js")
const { serviceMessages } = require("../constants/constants.js")

const uploadpath = path.join(__dirname,"..","..","public","uploads","documents")

require("dotenv").config()

/** 
 * takes name, email, password from body
 * register the user then return access token and refresh token
 * send them in cookies as well and update the sessions collection
 * if email already exists return error
*/
const register= async (req, res) => {
    const { name, email, password,conpassword,address,phone,role }= req.body

    if(!name || !email || !password || !conpassword) 
        return res.badrequest({},"name, email, password and confirm password are required")
        // return res.status(400).json({ message:  })

    if(password!=conpassword)
        return res.badrequest({},"password and confirm password does not match")
     
    try {
        const encpassword= await  bcrypt.hash(password, 10)
        const user = createUserLService({ Name:name, Email:email, Password: encpassword,Role: "USER",Address:address,Phone:phone,isVerified:true})
        
        return res.ok(user,"user registered successfully")

    } catch (error) {
        let errormsg=error.message
        if(errormsg.includes("E11000 duplicate key error collection")){
            let newkeys = Object.keys(error.keyValue)

            return res.badrequest({ fields: newkeys },"Already exist user data ")
        }
        res.internalError(data=errormsg)
    }
}

/** 
 * takes email, password from body
 * login the user then return access token and refresh token
 * send them in cookies as well and update the sessions collection
*/
const loginuser = async (req, res) => {
    const { email, password }= req.body
    const headers = req.headers
    if(!email || !password) 
        return res.badrequest({}, "email and password are required" )

    try {
       
        //is email registered
        const userData = await getUserByEmail(email)

        if(typeof userData==string && userData==serviceMessages.USER_NOT_FOUND)
            return res.badrequest({}, "User not found" )
        
        //if user is blocked return the error
        if(user.status==2){
            return res.badrequest({}, "user is blocked and cannot login" )
        }

        //find the user with email
        let user= await userModal.findOne({ Email: email })
        
        //check password
        let isMatch= await bcrypt.compare(password, user.Password)
        if(!isMatch)
            return res.badrequest({}, "invalid email or password" )

         //setting expiry time for access token and refresh token
        const expiryAccessToken = new Date();
        expiryAccessToken.setMinutes(expiryAccessToken.getMinutes() + 15);//15 minutes from current time

        const expiryRefreshToken = new Date();
        expiryRefreshToken.setHours(expiryRefreshToken.getHours() + 720);//720 hours that is 30 days from right now
       
        const sessionId= crypto.randomUUID()

        //generate accessToken and refreshToken
        let accessToken= jwt.sign({ sid:sessionId, id: user?._id?.toString() ,name:user.Name,type:"accessToken",role:user.Role }, ACCESSTOKEN_SECRET,{expiresIn: "15m"})
        let refreshToken= jwt.sign({ sid:sessionId, id: user._id?.toString(),name:user.Name,type:"refreshToken" }, REFRESHTOKEN_SECRET, { expiresIn: "30d" })

        const createSessionPayload = {
            userId: user._id,
            platform: headers['sec-ch-ua-platform']?`${headers['sec-ch-ua-platform'] + headers['user-agent']}` : headers['platform']? `${headers['platform']}` : "APP",
            sessionId,
            loginIP:req.ip || "0",
            refreshToken,
            createdAt: new Date(), 
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }

        //service to create and load sessions data in the redis and db
        await createLoadSession(createSessionPayload)

        //send the accesstoken and refreshtoken in cookies for browser
        res.cookie("accesstoken", accessToken, { httpOnly: true, expires: expiryAccessToken });
        res.cookie("refreshtoken", refreshToken, { httpOnly: true, expires: expiryRefreshToken });


        //send the response for successfull login
        res.ok({name:user.Name,status:user.status,email:user.Email, accesstoken, refreshtoken,userid:user._id },"user logged in successfully")
    } catch (error) {
        console.log(error)
        console.log(error.message)
        res.internalError({}, "unable to login user" )
        }
}
/** 
 * logged in users can update all of their personal information i.e  name,email, phone, address
*/
const updateAccInfo = async (req, res) => {
    try {
        const { name,email, phone, address } = req.body;
        const {id} = req.tokendata;

        let user = updateUserLService(id,{
            name,email, phone, address
        })

        if (typeof user == string && user== serviceMessages.USER_NOT_FOUND) {
            return res.badrequest( message= "user not found" );
        }

        res.ok(user,"user information updated successfully" );
    }catch{
        console.log(error.message)
        res.status(500).json({},"unable to update information")
    }
}


/** 
 * get access token from refresh token
 * refreshtoken is stored in sessions collection and refreshtoken is received from header or cookie
*/
const getaccesstoken= async (req, res) => {
    const redisclient = await getRedisClient()

    //fetch refreshtoken from header
    let refreshtoken= req.headers.refreshtoken

    //if header doesn't contain refreshtoken then fetch it from cookie
    if(!refreshtoken){
        refreshtoken= req.cookies.refreshtoken
    }

    //if refreshtoken is not present in cookie and header then return the error in response
    if(!refreshtoken) 
        return res.badrequest({},"refreshtoken is required" )

    

    const currentDate = new Date();
    const expiryAccessToken = new Date(currentDate);
    expiryAccessToken.setHours(currentDate.getMinutes() + 15);//15minutes 


    try {
        let payload= jwt.verify(refreshtoken, REFRESHTOKEN_SECRET)

        // const refreshtokens= await redisclient.get(`${payload.id}`)
        const tokenData = await fetchTokenData({sessionId:payload.sid})
        // console.log(JSON.parse(refreshtokens))

        if (typeof tokenData === "string") {
            if (tokenData === serviceMessages.SESSION_NOT_FOUND) {
                return res.badrequest({}, "Session Not Found");
            } else if (tokenData === serviceMessages.USER_NOT_FOUND) {
                return res.badrequest({}, "User not found");
            } else if (tokenData === serviceMessages.ACCOUNT_BLOCKED) {
                return res.badrequest({}, "User is blocked");
            }
        }


        let accesstoken= jwt.sign({ sid:payload.sid,id: payload.id,type:"accessToken"}, ACCESSTOKEN_SECRET,{expiresIn: "15m"})
        res.cookie("accesstoken", accesstoken, { httpOnly: true, expires: expiryAccessToken }); //send the new access token in cookie

        res.ok({name:tokenData.name,status:tokenData.status,email:tokenData.email, accesstoken},"accessToken generated successfully")

    } catch (error) {
        if(error.message.includes("jwt expired")){
            return res.badrequest({},message="refreshtoken expired")
        }else if(error.message.includes("jwt malformed")){
            return res.badrequest({},message="refreshtoken invalid")
        }
        res.internalError({}, "unable to login user" )
    }
}

/**
 * logout user by taking refreshtoken from header or cookie
 * refreshtoken is received from header or cookie
 * finds and deletes the refreshtoken from sessions collection to make sure that the session has been deleted successfully
 * Response will be sent with refreshtoken deleted and cookies will be send with empty values
*/
const logoutuser= async (req, res) => {
    const redisclient = await redisClient()

   //fetch refreshtoken from header
   let refreshtoken= req.headers.refreshtoken

   //if header doesn't contain refreshtoken then fetch it from cookie
   if(!refreshtoken){
       refreshtoken= req.cookies.refreshtoken
   }

    //if refreshtoken is not present in cookie and header then return the error in response
    if(!refreshtoken) 
        return res.badrequest({},message= "refreshtoken is required" )

    const checkrefreshtoken = await redisclient.get(refreshtoken)
    if(!checkrefreshtoken){
        return res.badrequest({},message= "refreshtoken invalidated" )
    }else{
        await redisclient.del(refreshtoken)
    }

    try {
        // let payload= jwt.verify(refreshtoken, REFRESHTOKEN_SECRET)
        await redisclient.del(refreshtoken)
        let user= await sessionmodel.deleteOne({ refreshtoken })

        if(!user.deletedCount)
            return res.badrequest({},message= "session not found" )


        res.cookie("refreshtoken", "", { httpOnly: true, expires: new Date(0) })
        res.cookie("accesstoken", "", { httpOnly: true, expires: new Date(0) })
        res.ok({},"user logged out successfully" )
    } catch (error) {
        if(error.message.includes("jwt expired")){
            return res.badrequest(message= "refreshtoken expired" )
        }else if(error.message.includes("jwt malformed")){
            return res.badrequest(message= "refreshtoken invalid" )
        }
        res.ok({},"unable to logout")
    }
}

//from here pending to convert to the redis
//will accept userid from header and then logout user from all the sessions by invalidating the refreshtokens
const logoutAllSessions= async (req, res) => {
    //fetch refreshtoken from header
    let userid= req.headers.userid
    const redisclient = await getRedisClient()

    //if header doesn't contain refreshtoken then fetch it from cookie
    if(!userid){
        userid= req.cookies.userid
    }
 
     //if refreshtoken is not present in cookie and header then return the error in response
     if(!userid) 
         return res.badrequest({}, "User id is required" )
 
     try {
        //  let payload= jwt.verify(refreshtoken, REFRESHTOKEN_SECRET)

        let usersList= await userModal.find({_id:Object(userid)})
        if(!usersList)
            return res.badrequest({}, "user not found" )
        
        usersList.forEach(async (user) => {
            let resquery = await sessionmodel.deleteMany({ userId: user.id} )
        });


         let user= await userModal.findOne({_id:Object(userid)})
         if(!user)
             return res.badrequest({}, "user not found" )

        //  console.log(user)
         let resquery = await sessionmodel.deleteMany({ userId: user.id} )
         
         await redisclient.del(user.id)

         res.cookie("refreshtoken", "", { httpOnly: true, expires: new Date(0) })
         res.cookie("accesstoken", "", { httpOnly: true, expires: new Date(0) })
         res.ok({}, "Successfully logged out user from "+resquery.deletedCount+" sessions" )
     } catch (error) {
         console.log(error.message)
         if(error.message.includes("jwt expired")){
             return res.badrequest({}, "refreshtoken expired" )
         }else if(error.message.includes("jwt malformed")){
             return res.badrequest({}, "refreshtoken invalid")
         }
         res.internalError({},"unable to logout user")
     }
 }

//takes email and then generates the otp from body, its valid for 10 minutes for now
const generateOTP = async (req, res) => {
    const otpvalidity = 10 //set validity of otp in minutes
    let email = req.body.email
    let baseotp =  Math.floor(3000 + Math.random() * 700000).toFixed(0)
    
    const otpExpiry = new Date();   
    otpExpiry.setMinutes(otpExpiry.getMinutes() + otpvalidity);//1 minutes from current time

    if(!email) 
        return res.ok({}, "email is required")

    if(baseotp.length==5)
        baseotp=baseotp+ baseotp[3]
    else if(baseotp.length==4)
        baseotp=baseotp[3]+baseotp+baseotp[0]

    // console.log(baseotp)
    //check OTP in mongoDB database

    try {
        const updateOTP= await userModal.updateOne({Email:email},{$set:{otp:baseotp,otpGeneratedAt:new Date(),otpExpiresAt:otpExpiry}})
        //here will come the logic for sending otp i.e email or phone number

        res.json({ validity:`${otpvalidity} minutes`  },"OTP sent successfully");
    } catch (error) {
        res.internalError({},"Unable to send otp");
    }
}

//takes otp, email from body and validates the otp. If otp validated them remove the otp from database and return success
const validateotp = async (req, res) => {
    const {email, otp} = req.body
    const todaynow=new Date()
    if(!email || !otp){
        return res.ok({},"email and otp are required" )
    }
    try {
        let userdata= await userModal.findOne({Email:email})
        if(!userdata)
            return res.ok({},"user not found" )

        const expiresAt= new Date(userdata.otpExpiresAt)
        if(expiresAt<todaynow){
            return res.ok({},"Expired OTP" )
        }


        if(userdata.otp!=otp){
            return res.ok({},"Invalid OTP" )
        }

        //if the OTP is valid then update the database by removeing the OTP and return the success response
        const updateOTP= await userModal.updateOne({Email:email},{$set:{otp:"",otpGeneratedAt:null,otpExpiresAt:null}})
        
        res.ok({ },"OTP is valid" );

        
    } catch (error) {
        res.internalError({ },"Unable to validate otp")
    }
}

/**
 * post request takes email, old password, new password and confirm new password
 * changes the password to the new one
*/
const changepassword = async (req, res) => {
    const {email,oldpass,newpass,confirmnewpass} = req.body
    if(!oldpass || !newpass || !confirmnewpass){
        return res.badrequest({ },"old password, new password and confirm new password are required")
    }

    if(newpass!=confirmnewpass){
        return res.badrequest({},"new password and confirm new password does not match")
    }

    try {
        let userdata= await userModal.findOne({Email:email})
        if(!userdata)
            return res.badrequest({ },"user not found" )

        let compareresult = await bcrypt.compare(oldpass, userdata.Password)
        if(!compareresult){
            return res.badrequest({ },"old password is incorrect" )
        }

        let hashednewpass= await bcrypt.hash(newpass, 8)

        const updatePassword= await userModal.updateOne({Email:email},{$set:{Password:hashednewpass}})

        res.ok({ },"Password changed successfully");
    }catch(error){
        console.log("change password error :"+error.message)
        res.internalError({},"unable to change password")
    }
}

/**
 * takes email,otp,newpass,confirmnewpass from body
 * changes the password to the new one, when a valid OTP has been validated
*/
const resetpasswordwithotp = async (req, res) => {
    const {email,otp,newpass,confirmnewpass} = req.body
    const todaynow=new Date()
    if(!email ||!otp || !newpass || !confirmnewpass){
        return res.badrequest({},"email, otp, new password and confirm new password are required")
    }

    if(newpass!=confirmnewpass){
        return res.badrequest({},"new password and confirm new password does not match")
    }

    try {
        let userdata= await userModal.findOne({Email:email})
        if(!userdata)
            return res.badrequest({},"user not found" )
        const expiresAt= new Date(userdata.otpExpiresAt)
      
        if(userdata.otpExpiresAt==null){
            return res.badrequest({},"OTP not generated")
        }
        if(expiresAt<todaynow){
            return res.badrequest({},"Expired OTP" )
        }

        if(userdata.otp=="")
            return res.badrequest({},"OTP not generated")

        if(userdata.otp!=otp){
            return res.badrequest({},"Invalid OTP")
        }

        let hashednewpass= await bcrypt.hash(newpass, 8)

        const updateUserData= await userModal.updateOne({Email:email},{$set:{Password:hashednewpass,otp:"",otpGeneratedAt:null,otpExpiresAt:null}})

        res.ok({},"Password changed successfully");
    }catch(error){
        console.log("change password error :"+error.message)
        res.badrequest({  },"unable to change password")
    }
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * Send response with the list of users sessions
 */
const getMySessions = async (req,res)=>{
    try {
        const {id} = req.tokendata
        const sessions = await sessionmodel.find()
        res.ok({userId:id,sessions})
    } catch (error) {
        res.internalError()
    }
}


//these will be enabled in the future section when they are found to be needed explicitly needed
/**
 * Diskstorage allows you to write a custom login before saving the file on disk
 * else const uploadsetup = multer({dist:"upload dir"})--is more than enough to save the files
 */
// const diskstorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         if(!fs.existsSync(uploadpath)){ //check if the directory exists and if not then create it
//             fs.mkdirSync(uploadpath,{ recursive: true })//this will create all the parent dir as well if they don't exist
//         }
//         cb(null, uploadpath)
//     },
//     filename: function (req, file, cb) {
//         let newfilename = Date.now() + "." + file.originalname.split(".").at(-1); //file name is unique by renaming it to a timestamp
//         cb(null, newfilename)
//     },
//     fileFilter: (req, file, cb) => { // Only allow certain file types 
//         const allowedTypes = ['image/jpeg', 'image/png','image/*']; //tyes of file allowed for uploading, currently its jpg and jpeg.
//                                                         // docs : https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types
//         if (!allowedTypes.includes(file.mimetype)) {
//             return cb(new Error('Invalid file type')); 
//         } 
//         cb(null, true);
//     }


// })

/**
 * This function accepts dest or storage as storage paths. 
 * if dest then directly the path on the disk can be given: multer({dist:"upload dir"})
 * if storage custom logic for either diskstorage or MemoryStorage needs to be defined
 */
// const uploadsetup = multer({ storage: diskstorage })

// const uploadfile = async (req, res) => {
//     const file=req.files.test //test is the name of the field in the form and accepts in the controller
//     const filenamelist=file.map(file=>file.filename) //returns a new array of filenames
//     if(file){
//         res.json({message:"file uploaded successfully", filenames:filenamelist})
//     }else{
//         res.status(500).json({message:"unable to upload file"})
//     }
// }



const userData=async (req,res)=>{
    try {
        console.log(req.body)
        let userData= await userModal.findById(req.tokendata.id)
        res.ok({userName:userData.Name,userEmail:userData.Email, userRole:userData.Role,userId:req.tokendata.id})
    } catch (error) {
        res.internalError({errormsg:error.message})
    }
    
}
module.exports={register, loginuser,updateAccInfo, getaccesstoken,logoutuser,logoutAllSessions,
    generateOTP, userData,  validateotp,changepassword,resetpasswordwithotp,getMySessions}