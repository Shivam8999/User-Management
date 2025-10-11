    //Services to loazyload CRUD of sessions data and fetch
    const sessionsModel = require("../../models/SessionsModel")
    const sessionsRService = require("../redis/sessions-rservice")
    const sessionsConnectRService = require("../redis/sessionsconnect-rservice")
    const logger = require('../../middlewares/logger');
    const Users = require("../../models/UsersModel");
    const usersRService = require("../redis/users-rservice");
    const { serviceMessages } = require("../../constants/constants");

    const createLoadSession = async ({sessionId,userId,refreshToken,loginIp,platForm,expiresAt,})=>{
        try {
            let sessionData= sessionsModel.create({ 
                        userId,
                        sessionId,
                        platform:platForm,
                        loginIP:loginIp,
                        refreshToken,
                        createdAt: new Date(), 
                        expiresAt
                    })
            await sessionsRService.createSession(sessionId,{userId,refreshToken,expiresAt,isActive})
            await sessionsConnectRService.addUserSession(userId,sessionId)
            return sessionData
        } catch (error) {
            throw new Error(error)
        }
    }

    //update the refreshToken as we will be updating that as well
    const updateSessionRefreshToken = async ({refreshToken,sessionId,expiresAt})=>{
        try {
            await sessionsRService.updateSession(sessionId,{refreshToken,expiresAt})
        } catch (error) {
            throw new Error(error)  
        }
    }

    //Delete multiple sessions from db and redis both
    const deleteSessionsBySessionIds = async ({sessionIds})=>{
        try {
            sessionIds?.map( async (sessionId)=>{
                //this try catch to ensure that even if one fails others are executed
                try {
                    const sessions = await sessionsRService.getSession(sessionId);
                    await sessionsModel.findOneAndUpdate({sessionId},{'$set':{isDeleted:true}});
                    await sessionsRService.deleteSession(sessionId); //delete sessions
                    await sessionsConnectRService.removeUserSession(sessions.userId,sessionId); //delete the sessionId and userId mapping 
                } catch (error) {
                    logger.info(`Failed to delete sessionId : ${sessionId} Error: ${error?.message}`);
                }
            })
        } catch (error) {
            throw new Error(error)  
        }
    }

    //Delete multiple sessions with userId
    const deleteSessionsByUserId = async ({userIds})=>{
        try {
            userIds?.map( async (userId)=>{
                //this try catch to ensure that even if one fails others are executed
                try {
                    const sessions = await sessionsConnectRService.getUserSessions(userId);

                    await sessionsModel.findOneAndUpdate({userId},{'$set':{isDeleted:true}});

                    sessions?.map(async (sessionInfo)=>{
                        await sessionsRService.deleteSession(userId); //delete sessions
                        await sessionsConnectRService.removeUserSession(userId,sessionInfo.sessionId); //delete the sessionId and userId mapping 
                    })
                } catch (error) {
                    logger.info(`Failed to delete session for : ${userId} Error: ${error?.message}`);
                }
            })
        } catch (error) {
            throw new Error(error)  
        }
    }

    const fetchTokenData = async ({sessionId})=>{
        try {
            let sessionData = await sessionsRService.getSession(sessionId)
            if(!sessionData){
                sessionData = sessionsModel.findOne({sessionId,isDeleted:false}).lean()
            }

            if(!sessionData){
                return serviceMessages.SESSION_NOT_FOUND
            }

            let userData = await usersRService.getUser(sessionData.userId)

            if(!userData){
                userData = await Users.findById(sessionData.userId).lean();
            }

            if(!userData){
                return serviceMessages.USER_NOT_FOUND
            }

            if(userData.status==2){
                await deleteSessionsByUserId(userData._id)
                return serviceMessages.ACCOUNT_BLOCKED
            }
            return {id:userData._id,email:userData.Email,role:userData.Role,name:userData.Name,isVerified:userData.isVerified}

        } catch (error) {
            throw new Error(error)
        }
    }

    //get basic sessions data
    const getBasicSessionsByUserId = async ({userId})=>{
        try {
            let sessionsData = sessionsConnectRService.getUserSessions(userId);
            if(!sessionsData){
                sessionsData = await sessionsModel.find({userId},{sessionId:1, refreshToken:1, isVerified:1, expiresAt:1}).lean()

                if(sessionsData){
                    await sessionsData?.map(async (sessionData)=>{
                        await sessionsConnectRService.addUserSession(userId,sessionData.sessionId)

                        await sessionsRService.createSession(sessionData.sessionId,
                            {userId:sessionData.userId,
                                refreshToken:sessionData.refreshToken,
                                expiresAt:sessionData.expiresAt,
                                isActive:sessionData.isActives
                            })
                    })
                }
            }

            if(!sessionsData){
                return serviceMessages.SESSION_NOT_FOUND
            }
            return sessionsData
        } catch (error) {
            throw new Error(error)
        }
    }

    //get all sessions data for  
    const getDetailedSessionsByUserId = async ({userId})=>{
        try {
            
            const sessionsData = await sessionsModel.find({userId}).lean()
            if(!sessionsData){
                return serviceMessages.SESSION_NOT_FOUND
            }

            if(sessionsData.length()){
                return serviceMessages.SESSION_NOT_FOUND
            }

            return sessionsData
        } catch (error) {
            throw new Error(error)
        }
    }


    module.exports = {
        createLoadSession, updateSessionRefreshToken, deleteSessionsBySessionIds, deleteSessionsByUserId,
        fetchTokenData, getBasicSessionsByUserId, getDetailedSessionsByUserId
    }   