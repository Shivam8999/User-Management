const mongose= require("mongoose")
const loadEnv = require("../../loadenv")
require('dotenv').config()

const setupDB= () => {
    try {
        const setup=mongose.connect(`${loadEnv.DB_URL}`)
        return setup
    } catch (error) {
        console.log(error)
        throw new Error("unable to connect to db")
    }
}

module.exports= setupDB