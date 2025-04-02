const dotenv = require('dotenv');
dotenv.config();
module.exports = {
 database_name : process.env.DB_NAME,
 database_user : process.env.DB_USER, 
 database_password : process.env.DB_PASSWORD,
};



