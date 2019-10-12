db.users.createIndex({username: 1}, {unique: true});
db.users.createIndex({email: 1}, {unique: true});
