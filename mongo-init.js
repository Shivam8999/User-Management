// MongoDB initialization script for Docker
db = db.getSiblingDB('userManagement');

// Create a user for the application
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'userManagement'
    }
  ]
});

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('sessions');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "token": 1 }, { unique: true });

print('MongoDB initialization completed'); 