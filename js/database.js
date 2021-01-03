const mysql = require('mysql2');
const dbConnection = mysql.createPool({
      host     : 'localhost', // MYSQL HOST NAME
    user     : 'root', // MYSQL USERNAME
    password : '', // MYSQL PASSWORD
    database : 'nodejs_login' ,//MYSQL DATABASENAME
}).promise();
module.exports = dbConnection;
