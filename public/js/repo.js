
 function fun(clicked_id)
 {
    votes=clicked_id;
    alert("vote counted for"+" "+ votes);

const mysql = require('mysql');
var con = mysql.createConnection({
   host: "localhost",
   user: "root",
   password: "",
   database: "nodejs_login"
 });

 con.connect(function(err) {
   if (err) throw err;
   console.log("Connected!");
   var sql = "INSERT INTO votes (vote) VALUES ?";
   var values =  [votes];
   con.query(sql, [values], function (err, result) {
     if (err) throw err;
   });
 });
}