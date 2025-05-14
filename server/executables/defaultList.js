const mongoose = require("mongoose");
const List = require("../models/List");
const User = require("../models/User")
const { DBConnection } = require("../database/db");
const { sql } = require("../database/neon");


async function createDefaultListForAllUsers() {
  try {
    console.log("🔗 Connected to the database.");
    console.log("🔄 Starting background job: Create default 'My Favorites' list for all users...");

    const users = await User.find({});
    if (users.length === 0) {
      console.log("⚠️ No users found.");
      return;
    }

    for (const user of users) {
      console.log(`🔍 Processing user: ${user._id} (${user.email})`);

      const defaultLists = [
        { name: "My Favorites", description: "A list of my favorite problems" },
        { name: "To Solve", description: "Problems I plan to solve" },
        { name: "Solved", description: "Problems I have solved" },
      ];

      for (const list of defaultLists) {
        const existingList = await List.findOne({
          user_id: user._id,
          name: list.name,
        });

        if (existingList) {
          console.log(`✅ '${list.name}' list already exists for user: ${user._id}`);
          continue;
        }

        const newList = await List.create({
          name: list.name,
          description: list.description,
          user_id: user._id,
          problems: [],
        });

        console.log(`✅ Created '${list.name}' list for user: ${user._id}`);
      }
    }

    console.log("✅ Background job completed successfully.");
  } catch (error) {
    console.error("❌ Error in background job:", error.message);
  }
}

async function syncUsersFromSQLToMongo() {
  try {
    console.log(
      "🔄 Starting sync: Fetching users from SQL and syncing to MongoDB..."
    );
    const sqlUsers =
      await sql`SELECT id, firstname, lastname, email FROM users`;

    for (const sqlUser of sqlUsers) {
      console.log(`🔍 Processing user: ${sqlUser.id} (${sqlUser.email})`);
      const existingUser = await User.findOne({ _id: sqlUser.id });

      if (existingUser) {
        console.log(`✅ User already exists in MongoDB: ${sqlUser.id}`);
        continue;
      }

      const newUser = await User.create({
        _id: sqlUser.id,
        firstname: sqlUser.firstname,
        lastname: sqlUser.lastname,
        email: sqlUser.email,
      });

      console.log(`✅ User synced to MongoDB: ${newUser._id}`);
    }

    console.log("✅ Sync completed successfully.");
  } catch (error) {
    console.error("❌ Error during sync:", error.message);
  } finally {
    mongoose.connection.close();
    console.log("🔗 Database connection closed.");
  }
}

module.exports = { createDefaultListForAllUsers, syncUsersFromSQLToMongo };

// syncUsersFromSQLToMongo();
// createDefaultListForAllUsers();

(async () => {
  try {
    DBConnection();
    await createDefaultListForAllUsers();
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    mongoose.connection.close();
  }
})();