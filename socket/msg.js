var db = require('../db/mysql');
var sio = require('socket.io');
var IO = function(server) {
	var io = sio.listen(server)
	var users = {},
		usocket = {};
	var counter = 0;
	var xss = require('xss');
	// 添加或更新白名单中的标签 标签名（小写） = ['允许的属性列表（小写）']
	xss.whiteList['img'] = ['src'];
	// 删除默认的白名单标签
	delete xss.whiteList['div'];
	// 自定义处理不在白名单中的标签
	xss.onIgnoreTag = function(tag, html) {
		// tag：当前标签名（小写），如：a
		// html：当前标签的HTML代码，如：<a href="ooxx">
		// 返回新的标签HTML代码，如果想使用默认的处理方式，不返回任何值即可
		// 比如将标签替换为[removed]：return '[removed]';
		// 以下为默认的处理代码：
		return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}


	io.on('connection', function(socket) {
		console.log('a user connected.');
		var username = "";
		socket.on('disconnect', function() {
			console.log('user disconnected.');
		});
		socket.on('chat message', function(data) {
			var msg = data.msg
			data.user = xss(username || data.user);
			users[username] = data.user;
			data.msg = xss(msg);
			data.time = +new Date();
			console.log(data)
			if (!data.to) {
				console.log('public')
				sendmsg(data);
			} else {
				data.type = 2; //悄悄话
				console.log("one")
				sendUserMsg(data);
			}
			insertData(data);

		});
		socket.on('user join', function(data) {
			counter++;
			username = xss(data.user);
			users[username] = username;
			usocket[username] = socket;
			console.log('join:' + data.user);
			data.type = 0;
			data.users = users;
			data.counter = counter;
			data.msg = "欢迎<b>" + data.user + "</b>进入聊天室";
			sendmsg(data);
		});
		socket.on('add friend',function(data){
			//console.log(data);
			sendFriendMsg(data);
		})

		socket.on('friend reply',function(data){
			sendFriendReply(data);
		})
		socket.on('disconnect', function() {
			console.log('disconnect')
			if (username) {
				counter--;
				delete users[username];
				delete usocket[username];
				sendmsg({
					type: 0,
					msg: "用户<b>" + username + "</b>离开聊天室",
					counter: counter,
					users: users
				})
			}
		});

	});


	//插入数据库
	function insertData(data) {
		var conn = db.connect();
		var post = {
			msg: data.msg,
			uname: data.user,
			time: data.time.toString(),
			to: data.to
		};
		var query = conn.query('insert into chatmsg set ?', post, function(err, result) {
			console.log(err);
			console.log(result)
		})
		console.log(query.sql);
		conn.end();
	}

	function sendmsg(data) {
		io.emit('chat message', data);
	}

	function sendUserMsg(data) {
		if (data.to in usocket) {
			console.log('to' + data.to, data);
			usocket[data.to].emit('to' + data.to, data);
			usocket[data.user].emit('to' + data.user, data);
		}
	}

	function sendFriendMsg(data){
		if (data.friend_name in usocket) {
			usocket[data.friend_name].emit('fri' + data.friend_name, data);
			usocket[data.myself_name].emit('fri' + data.myself_name, data);
		}
	}
	function sendFriendReply(data){
		if(data.fri_name in usocket){
			usocket[data.fri_name].emit('reply' + data.fri_name, data);
			usocket[data.user].emit('reply' + data.user, data);
		}
	}
}
module.exports = IO;