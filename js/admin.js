var Motos = [
    '耽误太多时间，事情可就做不完了',
    '无论是冒险还是做生意，机会都稍纵即逝',
    '劳逸结合是不错，但也别放松过头'
]

var app = new Vue({
    el: "#app",
    data: {
        token: null,
        usrNo: null,
        usrName: null,
        appname : "大大网盘",
        apirt : "http://39.105.228.56:8080/disk",
        view : 'list',
        msg : '',
        errmsg: '',
        warnmsg : '',
        //attachListVars
        fileEntries: null,
        //Parameters among views
        viewPara: null,
        //PreviewWnd
        fileRename: '',
        listPage: {
            currentPage: 1,
            totalPage: 0,
            pageDivideNum: 10,
            targetPage: 1,
            entryFragment: []
        }
    },
    created: function() {
        var userNo = localStorage.getItem('usrNo');
        var token = localStorage.getItem('token');
        var nm = localStorage.getItem('usrName');
        if(userNo == null || token == null || nm == null)
        {
            localStorage.removeItem('usrNo');
            localStorage.removeItem('token');
            localStorage.removeItem('usrName');
            this.warnmsg = "您的登录信息已损坏，请重新登录。";
            setTimeout(()=>top.location.href="adminlogin.htm", 3000)
        }
        this.usrNo = userNo;
        this.token = token;
        this.usrName = nm;

        this.queryList();
    },
    methods: {
        pagePrev: function() {
            this.pgjmp(this.listPage.currentPage - 1);
        },
        pageNext: function() {
            this.pgjmp(this.listPage.currentPage + 1);
        },
        pageRefresh: function() {
            if(this.fileEntries == null) return;
            this.listPage.totalPage = Math.ceil(this.fileEntries.length / this.listPage.pageDivideNum);
            this.pgjmp(1);
        },
        pgjmp(page) {
            if(this.fileEntries == null) {
                this.listPage.entryFragment = null;
                return;
            }

            let sta = this.listPage.pageDivideNum * (page - 1);
            let fin = this.listPage.pageDivideNum * page;
            if(fin > this.fileEntries.length) fin = this.fileEntries.length;
            //fin -= 1;
            if(sta > this.fileEntries.length - 1) {
                alert('页码无效');
                return;
            }

            this.listPage.entryFragment = this.fileEntries.slice(sta, fin);

            this.listPage.currentPage = page;
            this.listPage.targetPage = page;
        },
        clearWarn: function() {
            this.warnmsg = '';
        },
        clearErr: function() {
            this.errmsg = '';
        },
        logout: function() {
            localStorage.removeItem('usrNo');
            localStorage.removeItem('usrName');
            localStorage.removeItem('token');
            top.location = 'adminlogin.htm';
        },
        clearMsg: function() {this.msg = ''},
        userInfo: function(id) {
            window.open('userInfo.htm?id=' + encodeURI(id), '_blank', 'location=no,menubar=no,status=no,height=300,width=400');
        },
        rnf: function(id) {
            if(this.fileRename == '') {
                alert('不可重命名为空文件名');
                return;
            }
            if(new RegExp('[\\\\/:*?\"<>|]').test(this.fileRename)) {
                alert('文件名非法');
                return;
            }

            $.ajax({
                url: this.apirt + '/attach/updateAttach',
                type: 'post',
                headers: {
                    Authorization: this.token
                },
                data: {
                    attachName: this.fileRename,
                    attachNo: id
                },
                success: (data) => {
                    if(data.code == 1) {
                        this.queryList();
                        this.fileRename = '';
                        this.msg = data.msg;
                        setTimeout(this.clearMsg, 2000);
                    }
                    else if (data.code == -1) {
                        this.errmsg = data.msg;
                    }
                    else this.errmsg = '接口返回结果违反规范'
                },
                error: this.normalErrProc
            })
        },
        vryf: function(sid, status) {
            if(status == '') {alert('状态为空'); return;}

            $.ajax({
                url: this.apirt + '/attach/auditAttach',
                type: 'POST',
                headers: {
                    Authorization: this.token
                },
                data: {
                    attachNo: sid,
                    auditStatus: status,
                    auditor: this.usrName
                },
                success: (data) => {
                    if(data.code == 1) {
                        this.msg = data.msg;
                        this.fileEntries.forEach(function(item, index, arr) {
                            if(item.sid == sid) {
                                arr.splice(index, 1);
                            }
                        });
                        setTimeout(()=>{this.msg = '';this.listView();}, 2000)
                    }
                    if(data.code == -1) {
                        this.errmsg = data.msg;
                    }
                }
            })
        },
        rmitem: function(sid) {
            $.ajax({
                url: this.apirt + '/attach/deleteAttach',
                type: 'POST',
                headers: {
                    Authorization: this.token
                },
                data: {
                    attachNo: sid
                },
                success: (data, status, xhr) => {
                    if(data.code == 1) {
                        //TODO: 改为弹窗。
                        alert('删除成功');
                        this.queryList();
                    }
                    else if(data.code == -1){
                        this.errmsg = '错误：' + data.msg
                    }
                    else {
                        this.errmsg = '接口违背约定'
                    }
                },
                error: this.normalErrProc
            });
        },
        previewWnd: function(entry) {
            this.view = "imgpreview"
            this.viewPara = {
                'uri': entry.uri,
                'id' : entry.sid,
                'name': entry.name,
                'format': entry.type,
                'size': entry.size,
                'date': entry.date,
                'usr': entry.usr
            }
        },
        changeMoto: function() {
            let a = Math.floor(Math.random() * Motos.length);
            $('#moto').text(Motos[a]);
        },
        listView: function() {this.view = 'list';},
        normalErrProc: function(xhr, status, err)
        {
            console.log(xhr);//DEBUG
            if(status == "timeout") alertmsg = "服务器响应超时"
            if(status == "parseerror") alertmsg = "数据错误"
            if(status == "error") {
                if(xhr.status == 403) {
                    this.errmsg = "登录信息过期，请重新登录"
                    localStorage.removeItem('usrNo');
                    localStorage.removeItem('token');
                    setTimeout(()=>top.location.href="adminlogin.htm", 2000)
                }
                if(xhr.status == 401) {
                    this.errmsg = "登录信息过期，请重新登录"
                    setTimeout(()=>top.location.href="adminlogin.htm", 2000)
                }
                if(xhr.status == 404) {
                    this.errmsg = "服务器资源丢失，请稍后再试"
                }
                if(xhr.status == 500) {
                    this.errmsg = "服务器内部错误"
                }
                if(xhr.status == 0) {
                    this.errmsg = "服务器无响应或未知错误"
                }
            }
        },
        queryList: function() {
            $.ajax({
                url: this.apirt + '/attach/queryNonCheckedAttachList',
                type: 'post',
                headers: {
                    Authorization: this.token
                },
                success: (data)=>{
                    // console.log(data)
                    if(data.code == 1) {
                        if(data.obj.length == 0) {
                            this.fileEntries = null;
                            this.pageRefresh();
                            return;
                        }
                        this.fileEntries = new Array();
                        let i = 0;
                        data.obj.forEach((entry) => {
                            this.fileEntries.push({
                                id: i++,
                                sid: entry.attachNo,
                                usr: entry.userNo,
                                name: entry.attachName,
                                size: entry.attachSize,
                                uri: entry.attachViewUrl,
                                type: entry.attachType,
                                date: new Date(+new Date(entry.createTime) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, ''),
                                user: entry.createUser//TODO:使人性化
                            })
                        })
                        this.pageRefresh();
                    }
                },
                error: this.normalErrProc
            })
        }
    }
})