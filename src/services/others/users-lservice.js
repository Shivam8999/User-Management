
const { serviceMessages } = require("../../constants/constants");
const Users = require("../../models/UsersModel");
const {
      // User email map
      setUserEmail, getUserIdByEmail,deleteUserEmail,
      // User profile
      createUser, getUser, updateUser, deleteUser
    } = require("../redis/users-rservice")

const createUserLService = async ({name,email,encpassword,role,phone,isVerified,role,status})=>{
    try {
        const users = await Users.create({ Name:name, Email:email, Password: encpassword,Role: role,Address:address,Phone:phone,status, isVerified})
        // email,status,name,role and isVerified
        await createUser(userId,{email,isVerified, status,role,name})
        await setUserEmail(email,users._id)
        return users
    } catch (error) {
        throw new Error(error)
    }
}

//update users data i.e all the fields in the db can be updated
const updateUserLService = async (id,payload)=>{
    try {
        let user = await userModal.findById(id);
        const {name,phone,email,address,isVerified,encpassword,role,status } = payload
        if (!user) {
            return serviceMessages.USER_NOT_FOUND;
        }

        user.Name = name || user.Name;
        user.Email = email || user.Email;
        user.Phone = phone || user.Phone;
        user.Address = address || user.Address;
        user.Password = encpassword || user.Password;
        user.Role = role || user.Role;
        user.isVerified = isVerified || user.isVerified;
        user.status= status || user.status;
        await user.save();

        if(email){
            await deleteUserEmail(user.Email)
            await setUserEmail(email,user._id)
        }

        await updateUser(id,{
            name:name||user.Name,
            email:email|| user.email,
            status:status|| user.status,
            role:role || user.Role,
            isVerified:isVerified,
        })

        return serviceMessages.SUCCESS
    } catch (error) {
        throw new Error(error)
    }
}

const getBasicUserData = async (userId) => {
  try {
    let userData = await getUser(userId);

    if (userData && Object.keys(userData).length > 0) {
      return userData; // Already cached in Redis
    }

    // Load only specific fields from DB using projection
    const dbUser = await Users.findById(
      userId,
      { Name: 1, Email: 1, Role: 1, status: 1, isVerified: 1 }
    ).lean();

    if (!dbUser) {
      return serviceMessages.USER_NOT_FOUND;
    }

    // Keep only Redis fields
    const redisData = {
      name: dbUser.Name,
      email: dbUser.Email,
      role: dbUser.Role,
      status: dbUser.status,
      isVerified: dbUser.isVerified
    };

    // Store in Redis for future use
    await createUser(userId, redisData);

    return redisData;
  } catch (error) {
    throw new Error(error);
  }
};

// 2. Get user data directly from DB
const getUserDirectFromDB = async (userId) => {
  try {
    const dbUser = await Users.findById(
      userId,
      { Name: 1, Email: 1, Phone: 1, Address: 1, Role: 1, status: 1, isVerified: 1 }
    ).lean();

    if (!dbUser) {
      return serviceMessages.USER_NOT_FOUND;;
    }
    return dbUser;
  } catch (error) {
    throw new Error(error);
  }
};

// 3. Check if email is already registered (with lazy loading)
const isEmailRegistered = async (email) => {
  try {
    // First check Redis
    let userId = await getUserIdByEmail(email);
    if (userId) {
      return true; // Found in cache
    }

    // Not found in Redis → check DB
    const dbUser = await Users.findOne(
      { Email: email },
      { _id: 1 }
    ).lean();

    if (!dbUser) {
      return false; // Not found anywhere
    }

    // Found in DB → cache in Redis for next time
    await setUserEmail(email, dbUser._id.toString());
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteUserLService = async (userId) => {
  try {
    // Step 1: remove from Redis (if exists)
    await deleteUser(userId);

    // Also remove email mapping if present
    const dbUser = await Users.findById(
      userId,
      { Email: 1 }
    ).lean();

    if (!dbUser) {
      return serviceMessages.USER_NOT_FOUND;;
    }
    await deleteUserEmail(dbUser.Email);

    // Step 2: remove from DB
    const result = await Users.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      return serviceMessages.USER_NOT_FOUND;;
    }

    return serviceMessages.SUCCESS;
  } catch (error) {
    throw new Error(error);
  }
};


async function getUserByEmail(email) {
  try {
    // Step 1: resolve userId via Redis
    let userId = await getUserIdByEmail(email);

    if (userId) {
      const redisUser = await getUser(userId);
      if (redisUser && Object.keys(redisUser).length > 0) {
        return redisUser; // Found in Redis
      }
    }

    // Step 2: fallback to DB
    const dbUser = await Users.findOne(
      { Email: email },
      { _id: 1, Name: 1, Email: 1, Role: 1, status: 1, isVerified: 1 }
    ).lean();

    if (!dbUser) {
      return serviceMessages.USER_NOT_FOUND;
    }

    // Step 3: cache in Redis for next time
    const redisData = {
      name: dbUser.Name,
      email: dbUser.Email,
      role: dbUser.Role,
      status: dbUser.status,
      isVerified: dbUser.isVerified
    };

    await createUser(dbUser._id.toString(), redisData);
    await setUserEmail(dbUser.Email, dbUser._id.toString());

    return redisData;
  } catch (error) {
    throw new Error(error);
  }
}
module.exports = {createUserLService, updateUserLService, getBasicUserData, getUserDirectFromDB, isEmailRegistered, deleteUserLService,getUserByEmail }
