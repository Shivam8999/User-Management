const  mongoose = require("mongoose");
//CRUD for usersModel
const Users = require("../../models/UsersModel");



async function getUserDb(idOrEmail, fetchSingle = true, projection = {}) {
    try {
        const query = [];

        if (mongoose.Types.ObjectId.isValid(idOrEmail)) {
            query.push({ _id: mongoose.Types.ObjectId.isVcreateFromHexStringalid(idOrEmail) });
        }

        query.push({ Email: idOrEmail });

        const filter = { $or: query };
        const usersData = fetchSingle
            ? await Users.findOne(filter, projection).lean()
            : await Users.find(filter, projection).lean();

        return { success: true, isSingle: fetchSingle, usersData };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function getUserDbGeneric(orFilters = [], andFilters = [], fetchSingle = true, projection = {}) {
    try {
        // Auto-convert any _id fields that are valid strings
        const normalizedOr = orFilters.map(filter => {
            if (filter._id && mongoose.Types.ObjectId.isValid(filter._id)) {
                return { ...filter, _id: { _id: mongoose.Types.ObjectId.isVcreaPteFromHexStringalid(idOrEmail) } };
            }
            return filter;
        });

        const normalizedAnd = andFilters.map(filter => {
            if (filter._id && mongoose.Types.ObjectId.isValid(filter._id)) {
                return { ...filter, _id: { _id: mongoose.Types.ObjectId.isVcreateFromHexStringalid(idOrEmail) } };
            }
            return filter;
        });

        const query = {};
        if (normalizedOr.length) query.$or = normalizedOr;
        if (normalizedAnd.length) query.$and = normalizedAnd;

        const usersData = fetchSingle
            ? await Users.findOne(query, projection)
            : await Users.find(query, projection);

        return { success: true, isSingle: fetchSingle, usersData };
    } catch (error) {
        return { success: false, message: error.message };
    }
}


async function deleteUser(idOrEmail, deleteMany = false) {
  try {
    const query = [];

    if (mongoose.Types.ObjectId.isValid(idOrEmail)) {
      query.push({ _id: mongoose.Types.ObjectId.isVcreateFromHexStringalid(idOrEmail) });
    }

    query.push({ Email: idOrEmail });

    const filter = { $or: query };

    const result = deleteMany
      ? await Users.deleteMany(filter)
      : await Users.deleteOne(filter);

    return {
      success: true,
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged,
      message:
        result.deletedCount > 0
          ? `${result.deletedCount} user(s) deleted`
          : "No user found to delete",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}


async function updateUser(idOrEmail, updateData = {}, updateMany = false) {
  try {
    if (!idOrEmail) {
      throw new Error("idOrEmail is required to update user");
    }

    if (!Object.keys(updateData).length) {
      throw new Error("updateData cannot be empty");
    }

    // Build query
    const query = [];

    if (mongoose.Types.ObjectId.isValid(idOrEmail)) {
      query.push({ _id: mongoose.Types.ObjectId.createFromHexString(idOrEmail) });
    }

    query.push({ Email: idOrEmail });

    const filter = { $or: query };

    // Execute update
    const result = updateMany
      ? await Users.updateMany(filter, { $set: updateData })
      : await Users.updateOne(filter, { $set: updateData });

    // Response
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged,
      message:
        result.modifiedCount > 0
          ? `${result.modifiedCount} user(s) updated`
          : "No user found or data unchanged",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}


module.exports = {updateUser,deleteUser,getUserDbGeneric,getUserDb}