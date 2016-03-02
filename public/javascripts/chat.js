$(function() {
    var user = "";
    var socket = null;
    var rejectarr=[];
    $("#u").keydown(function(e) {
        if (e.keyCode == 13) {
            $("#okname").click();
        }
    })
    $("#okname").click(function() {
        user = $.trim($("#u").val());
        if (user.length == 0) {
            alert('请填写昵称');
            $("#u").focus();
            return false;
        };
        socket = io();
        socket.on('chat message', function(data) {
            formatMsg(data);
        });
        $.get('/getmsg', {
            name: user
        }, function(result) {
            var html = '';
            for (var i = result.length - 1; i >= 0; i--) {
                var data = result[i];
                var message=showEmoji(data.msg);
                data.user = data.uname;
                var cls = '';
                if (data.user == $("#u").val()) {
                    cls = ' mine ';
                }
                html += '<li class="msg ' + cls + '"><p><b style="position: relative" class="user-name" data-username="' +  data.user +'">' + data.user + '</b>：<span>(' + formatTime(data.time) + ')</span></p><div>' + message + '</div></li>';
            }
            $('#messages').prepend(html);
            $('#messages').scrollTop(99999);
        }, 'json');
        $('#inputName').hide();
        $('#chat').show();
        socket.emit('user join', {
            user: user
        });
        //私聊
        // console.log('to'+user)
        socket.on('to' + user, function(data) {
            //console.log(data);
            formatMsg(data);
        })

        socket.on('fri'+user,function(data){
            friendMsg(data);
        })
    });
    $('#users').on('click', 'li', function() {
        var v = $(this).html();
        if ($('#sel_obj option[value="' + v + '"]').size()) {
            $('#sel_obj').val(v)
        } else {
            $('#sel_obj').append('<option value="' + v + '">' + v + '</option>');
            $('#sel_obj').val(v);
        }
    });
    $('form').submit(function() {
        if ($("#u").val().length == 0) {
            alert('请填写昵称');
            return false;
        }
        if ($("#m").val().length == 0) {
            alert('内容不能为空!');
            return false;
        }
        var msg=$('#m').val();
        var words=keywords;
        for(var i=0;i<words.length;i++){
            msg=msg.replace(new RegExp(words[i],'i'),new Array(words[i].length+1).join('*'));
        };
        socket.emit('chat message', {
            msg: msg,
            user: user,
            to: $('#sel_obj').val()
        });
        $('#m').val('');
        return false;
    });


    var nani = document.createElement('div');
    nani.className = 'nani';
    nani.style.width = '100px';
    nani.style.height = '100px';
    nani.style.backgroundColor = 'gray';
    nani.style.position = 'absolute';
    nani.style.left = '100%';
    nani.style.top = '0';
    nani.innerHTML = '<p class="add-friend">加为好友</p><p class="reject">屏蔽此人</p>';

    var target_name='';
    $('#messages').on('click', function (e){
        var target = e.target;
        if (target.classList.contains('user-name')) {
            target.appendChild(nani);
            target_name = target.dataset.username;
        } else if (target.classList.contains('reject')) {
            $('b[data-username="'+ target_name +  '"]').parent().parent().remove();
            $('#messages').append($('<li class="notice">系统通知：' + "你已经屏蔽了"+target_name+"的发言" + '</li>'))
            var aa=user+'/'+target_name;
            rejectarr.push(aa);
        } else if(target.classList.contains('add-friend')){
            //console.log(target_name);
            socket.emit('add friend', {
                friend_name: target_name,
                myself_name: user
            });
            $('.nani').remove();
        }else {
            $('.nani').remove();
        }
        return false;
    });
    $('body').on('click', function (e) {
        $('.nani').remove();
    });

    function formatMsg(data) {
        if (data.type === 0) {
            $('#messages').append($('<li class="notice">系统通知：' + data.msg + '</li>'))
        } else {
            if(data.user==="aa"){
                $('#messages').append($('<li class="notice">系统通知：' + "上完第四课才能发言哦!" + '</li>'));
            }else {
                var cls = '',
                    type = "";
                if (data.user == user) {
                    cls += ' mine ';
                }
                if (data.type === 2) {
                    cls += " private ";
                    type = "（悄悄话）"
                }
                var message=showEmoji(data.msg);
                var num=0;
                var bb=user+'/'+data.user;
                for(var i=0;i<rejectarr.length;i++){
                    if(rejectarr[i]===bb){
                        num++;
                    }
                }
                if(num===0) {
                    $('#messages').append($('<li class="msg ' + cls + '"><p><b style="position: relative" class="user-name" data-username="' + data.user + '">' + data.user + type + '</b>：<span>(' + formatTime(data.time) + ')</span></p><div>' + message + '</div></li>'))
                }
            }
        }
        if (data.counter) {
            $('#online').html('当前在线人数：' + data.counter + "人.");
            if (data.users) {
                var html = '';
                for (var i in data.users) {
                    html += '<li title="' + i + '">' + i + '</li>';
                }
                $('#userlist').html(html);
            }
        }
        $('#messages').scrollTop(99999);
    }

    function friendMsg(data){
        if (data.myself_name === user) {
            $('#messages').append($('<li class="notice">系统通知：' + "你向"+data.friend_name+"发送了添加好友请求" + '</li>'));
            var m  = document.querySelector('#messages');
            m.scrollTop = m.scrollHeight;
        } else {
            $('#messages').append($('<li class="notice">系统通知：' + data.myself_name+"请求添加你为好友<a>同意</a>或者<a>拒绝</a>"+ '</li>'));
            var m  = document.querySelector('#messages');
            m.scrollTop = m.scrollHeight;
        }
    }
    function showEmoji(msg){
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="images/emoji/' + emojiIndex + '.gif" />');
            };
        };
        return result;
    }
    function formatTime(time) {
        var d = new Date(parseInt(time));
        var str = "";
        str += d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        return str;
    }
});