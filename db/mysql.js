var mysql = require('mysql')

var db={
	connect:function(){
	

		var conn = mysql.createConnection({
		    host: 'localhost',
		    user: 'root',
		    password: '',
		    database:'test',
		    port: 3306
		});
		//var conn = mysql.createConnection({
		//    host: 'db4free.net',
		//    user: 'lovewebgames',
		//    password: 'qwerasdfzxcv',
		//    database:'lovewebgames',
		//    port: 3306
		//});
		conn.connect();
		return conn;
	}
}

module.exports = db;