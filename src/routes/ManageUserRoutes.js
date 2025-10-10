const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const { register, loginuser, updateAccInfo, getaccesstoken, logoutuser, logoutAllSessions, userData,generateOTP, validateotp, changepassword, resetpasswordwithotp } = require("../controllers/userController");
const { validateAccessToken } = require('../helpers/TokenHelpers');

router = express.Router();

//User routes start from here
router.get("/hello", (req, res) => { res.json({ msg: "Sever is returning hello to your request" }) });


router.post("/user/register",
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    validateRequest
  ],
  register
);

router.post("/user/login",
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    validateRequest
  ],
  loginuser
);
//Get access token using refresh token
router.get("/user/getaccesstoken", getaccesstoken);

//logout the user from current session using refreshtoken
router.delete("/user/logout", logoutuser);

//view active sessions
router.get("/user/getsessions",validateAccessToken,)

//logout from all the sessions
router.delete("/user/logoutallsessions", logoutAllSessions);
router.post("/user/validateaccesstoken", validateAccessToken, (req, res) => { res.json({ message: "access token is valid" }) });

router.post("/user/generateotp",
  [body('email').isEmail(), validateRequest],
  generateOTP
);

router.post("/user/validateotp",
  [body('otp').isLength({ min: 4, max: 8 }), validateRequest],
  validateotp
);
router.post("/user/changepassword",
  [body('oldPassword').notEmpty(), body('newPassword').isLength({ min: 6 }), validateRequest],
  changepassword
);
router.post("/user/resetpasswordwithotp",
  [body('otp').notEmpty(), body('newPassword').isLength({ min: 6 }), validateRequest],
  resetpasswordwithotp
);

router.put("/user/updateinfo", validateAccessToken, updateAccInfo);

router.get("/getuserdata", validateAccessToken, userData);

// router.post("/user/fileupload", uploadsetup.fields([
//   { name: 'test', maxCount: 1 },
// ]), uploadfile);

module.exports = router;