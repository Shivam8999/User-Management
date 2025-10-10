const userModal= require("../models/UsersModel.js")
const sessionmodel= require("../models/SessionsModel.js")
const bcrypt = require("bcrypt")
const jwt= require("jsonwebtoken")
const {generateRandomPassword} = require("../utils/passwordGenerator.js")
const {roles} = require("../constants/constants.js")
/** 
 * takes name, email, password from body
 * register the user then return access token and refresh token
 * send them in cookies as well and update the sessions collection
 * if email already exists return error
*/
const register= async (req, res) => {
    const { name, email, address,phone,role }= req.body

    if(!name || !email) 
        return res.badrequest({},"name and email are required")

    try {
        const generatedPassword = generateRandomPassword(8)
        const encpassword= await  bcrypt.hash(generatedPassword, 10)
        let user= new userModal({ Name:name, Email:email, Password: encpassword,Role: roles.user,Address:address,Phone:phone })
        await user.save()
        
        return res.ok({...user._doc,Password:generatedPassword},"user registered successfully")

    } catch (error) {
        let errorMessage=error.message
        //console.log(errorMessage) //logs as the error as errors can be long and db specific
        if(errorMessage.includes("E11000 duplicate key error collection")){
            let newkeys = Object.keys(error.keyValue)

            return res.badrequest({fields: newkeys },"Already Exist user" )
        }
        res.internalError({ },"Unable to register user")
    }
}

const blockuser= async (req, res) => {
    const {userid,isBlocked,tokendata} = req.body
    if(tokendata.role!="admin")
        return res.unauthorized()
    if(!userid || !isBlocked) 
        return res.badrequest({}, "userid and isBlock status is required")

    try {
        const user= await userModal.findById(userid)
        if(!user){
            return res.badrequest({}, "user not found")
        }

        if(isBlocked=="true")
            user.status= 2
        else
            user.status= 1
        await user.save()

        res.ok({},`user ${isBlocked=="true"?"blocked":"unblocked"} successfully`)
    } catch (error) {
        console.log(error.message);
        res.internalError({},"Unable to block user")
    }
}

const changeRole= async (req, res) => {
    const {userid,role,tokendata} = req.body
    if(tokendata.role!="admin")
        return res.forbidden()
    if(!userid || !role) 
        return res.badrequest({},"Userid and role is required")

    try {
        const user= await userModal.findById(userid)
        if(!user){
            return res.badrequest(req.body,"user not found")
        }

        user.Role= role
        await user.save()
        res.ok(user,"user role changed successfully")

    } catch (error) {
        console.log(error.message);
        res.internalError({},"unable to change role")
    }

}

const deleteUser= async (req, res) => {
    const {userid,tokendata}=req.body
    if(tokendata.role!="admin")
        return res.forbidded()
    if(!userid) 
        return res.badrequest({}, "userid is required")

    try {
        const user= await userModal.findByIdAndDelete(userid)
        if(!user){
            return res.badrequest({}, "user not found")
        }
        res.ok({...user }, "user deleted successfully")
    } catch (error) {
        console.log(error.message);
        res.internalError({}, "unable to delete user")
    }
}

const getUserList = async (req,res)=>{
    const { query, limit = 10, page = 1, statusFilter, sortBy = "Name", sortOrder = "asc" } = req.query;
    let dbQuery = {}

    try {
        if (statusFilter) {
            dbQuery.status = Number(statusFilter);
        }

        if (query) {
            const regex = new RegExp(query, "i"); // case-insensitive partial match
            dbQuery.$or = [
                { Name: regex },
                { Email: regex },
                { Phone: regex }
            ];
        }

        const sortOption = {};
        sortOption[sortBy] = sortOrder === "desc" ? -1 : 1;

        const options={
            limit,  
            page
        }

        const data = await userModal.paginate(dbQuery,options)
        res.ok(data)
 
    } catch (error) {
        console.log(error)
        res.internalError()
    }
}

//
/**
 * block and unblock multiple user, but can't update status of your own account
 * If you are blocking any user all their sessions will terminated from db and redis
 * Accepts userIds:[] and isBlocked:boolean, if isBlocked is set to true then it will block all the users and if its false it will unblock all the users
 */
const blockUnblockListOfUsers = async (req,res)=>{
    try {
        const {userIds,isBlocked} = req.body
        const {id}=req.tokendata
        if(!Array.isArray(userIds)){
            res.badrequest(req.body,'Invalid User Ids')
        }

        await userIds.map(async (item)=>{
            if (item!=id){
                await userModal.findByIdAndUpdate(item,{$set:{"status":isBlocked?2:1}})

                if(isBlocked){//if we are blocking the users then delete their sessions
                    await sessionmodel.deleteMany({"userId":item})
                }
            }
        })

        res.ok()

        // const data = await userModal.findByIdAndUpdate
    } catch (error) {
        res.internalError()
    }
}

const verifyAdminLogin = async (req, res) => {
    res.ok({message:"Admin Verified"})
}

module.exports={register,blockuser,changeRole,deleteUser,getUserList,verifyAdminLogin,blockUnblockListOfUsers}