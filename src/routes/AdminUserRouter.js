const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const { register, changeRole, blockuser, deleteUser, getUserList,verifyAdminLogin, blockUnblockListOfUsers } = require("../controllers/adminController");
const { validateAdminAccessToken } = require('../helpers/TokenHelpers');


const router = express.Router();

router.get("/verifyadminlogin",validateAdminAccessToken,verifyAdminLogin)

router.post("/register",[ body('name').notEmpty(), body('email').notEmpty(),validateRequest],register)

//Admin routes starts from here
router.put("/updateaccrole",
  [validateAdminAccessToken, body('userId').notEmpty(), body('role').notEmpty(), validateRequest],
  changeRole
);

router.post("/blockunblockuser",
  [validateAdminAccessToken, body('userId').notEmpty(), body('block').isBoolean(), validateRequest],
  blockuser
);

router.patch('/blockstatus',[validateAdminAccessToken,body('userIds').notEmpty(),validateRequest],blockUnblockListOfUsers)
// router.patch('/unblockmultipleusers',[validateAdminAccessToken,body('userIds').notEmpty(),validateRequest],unblockListOfUsers)


router.delete("/deleteuser",
  [validateAdminAccessToken, body('userId').notEmpty(), validateRequest],
  deleteUser
);

/**
 * lists and searches from the users table, ans searches with name, email and phone
 * @param: query, limit = 10, page = 1, statusFilter, sortBy = "Name", sortOrder = "asc"
 */
router.get("/userlist",validateAdminAccessToken, getUserList);

module.exports = router;