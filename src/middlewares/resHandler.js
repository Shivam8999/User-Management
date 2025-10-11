const resStatusHandler = async (req, res,next) => {
    res.ok = (data={},message="Successfull")=>{
        return res.json({status:200,
            message,
            data
        })
    }

    res.badrequest = (data={},message="Bad Request")=>{
        return res.status(400).json({status:400,
            message,
            data
        })
    }

    res.notfound = (data={},message="Not Found")=>{
        return res.status(400).json({status:400,
            message,
            data
        })
    }

    res.unauthorized = (data={},message="Unauthorized For This Operation")=>{
        return res.status(401).json({status:401,
            message,
            data:{}
        })
    }

    res.forbidden = (message='Operation Not Permitted')=>{
        return res.status(403).json({status:403,
            message,
            data:{}
        })
    }

    res.internalError = (data={},message="Internal Server Error")=>{
        return res.status(500).json({status:500,
            message,
            data
        })
    }

    next()
}

module.exports = {resStatusHandler}