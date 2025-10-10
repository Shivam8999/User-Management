const jwt= require("jsonwebtoken")
const {ACCESSTOKEN_SECRET} = require("../../loadenv")
const {roles} = require("../constants/constants.js")

/**
 *  will accept access token from header and then validate it
 * it adds the tokendata to the request body
 * {  id: 'mongodb object id',  name: 'name in token', type: 'accessToken|refreshToken',  role: 'admin|user' }
*/

const validateAccessToken = async (req, res, next) => {
    let accessToken = req.cookies.accesstoken;
    if (!accessToken) {
        try {
            accessToken = req.headers.authorization.split(" ")[1];
        } catch (error) {
            console.log(error.message);
            res.status(401).json({ message: "Authorization token not found" });
            return
        }
        console.log(accessToken)
      }
    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    try {
        let tokendata = await jwt.verify(accessToken, ACCESSTOKEN_SECRET);
       
        // console.log(req.body) //uncomment this if needed to see the tokendata for understanding

        // req = {...req,body:{req.body && ...req.body,tokendata:tokendata}}//this will add the tokendata to the request body for get req, as get does not have req.body default
        req.tokendata= tokendata
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ message: "Invalid access token" });
    }
}

const validateAdminAccessToken = async (req, res, next) => {
    let accessToken = req.cookies.accesstoken;
    let refereshToken = req.cookies.refereshtoken;

    if (!accessToken && !refereshToken) {
        try {
            accessToken = req.headers.authorization.split(" ")[1];
        } catch (error) {
            res.status(401).json({ message: "Authorization token not found" });
            return
        }
      }
      
    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    try {
        let tokendata = await jwt.verify(accessToken, ACCESSTOKEN_SECRET);
        // console.log(tokendata) //uncomment this if needed to see the tokendata for understanding

        if(tokendata.role!=roles.admin){
            return res.status(403).json({ message: "Not Authorised" });
        }

        req.tokendata= tokendata

        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ message: "Invalid access token" });
    }
}



module.exports = {validateAccessToken,validateAdminAccessToken}