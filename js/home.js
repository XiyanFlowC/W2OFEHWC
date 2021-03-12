var app = new Vue({
    el: "#app",
    data: {
        appname : "大大网盘",
        apirt : "http://39.105.228.56:8080/disk",
        view : "list",//"upload", //list upload preview
        warnmsg : "",
        errmsg : "",
        msg : "",
        fileEntries : null,
        usrNo : "",
        token : "",
        dirNo : null,
        viewPara: {},
        showFolds : false,
        spaceFolders : null,
        folderName: "",
        fileRename: "",
        foldRename: '',
        usrName: '',
        listPage: {
            currentPage: 1,
            totalPage: 0,
            pageDivideNum: 20,
            targetPage: 1,
            entryFragment: []
        }
    },
    created: function() {
        var userNo = localStorage.getItem('usrNo');
        var token = localStorage.getItem('token');
        var userName = localStorage.getItem('usrName');
        if(userNo == null || token == null)
        {
            localStorage.removeItem('usrNo');
            localStorage.removeItem('token');
            localStorage.removeItem('usrName');
            this.warnmsg = "您的登录信息已损坏，请重新登录。";
            setTimeout(()=>top.location.href="login.htm", 3000)
        }
        this.usrNo = userNo;
        this.token = token;
        this.usrName = userName;

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
            this.listPage.totalPage = Math.ceil(this.fileEntries.length / this.listPage.pageDivideNum);
            this.pgjmp(1);
        },
        pgjmp(page) {
            let sta = this.listPage.pageDivideNum * (page - 1);
            let fin = this.listPage.pageDivideNum * page;
            if(fin > this.fileEntries.length) fin = this.fileEntries.length;
            //fin -= 1;

            this.listPage.entryFragment = this.fileEntries.slice(sta, fin);

            this.listPage.currentPage = page;
            this.listPage.targetPage = page;
        },
        logout: function() {
            localStorage.removeItem('usrName');
            localStorage.removeItem('usrNo');
            localStorage.removeItem('token');
            top.location = './login.htm'
        },
        userInfo: function() {
            window.open('userInfo.htm', '_blank', 'location=no,menubar=no,status=no,height=300,width=400');
        },
        switchFold: function(id) {
            this.dirNo = id;
            this.queryList();
        },
        switchFoldersShow: function() {
            this.showFolds = !this.showFolds;
        },
        addFold: function() {
            if(this.folderName == '') {
                alert('文件夹名称不可为空');
                return;
            }
            $.ajax({
                url: this.apirt + '/index/addIndex',
                type: 'POST',
                headers: {
                    Authorization: this.token
                },
                data: {
                    indexName: this.folderName
                },
                success: (data) => {
                    if(data.code == 1) {
                        this.queryList();
                        this.msg = '创建成功';
                        this.folderName = '';
                    }
                    else if(data.code == -1) {
                        this.errmsg = data.msg
                    }
                    else {
                        this.errmsg = "接口返回结果违反规范"
                    }
                },
                error: this.normalErrProc()
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
        downld: function(entry) {
            window.open(this.apirt + '/attach/downloadAttach?attachName='
            + encodeURI(entry.name) + '&attachNo='
            + encodeURI(entry.sid) + '&userNo='
            + encodeURI(this.usrNo), '_blank');
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
        previewWnd: function(entry) {
            this.view = "imgpreview"
            this.viewPara = {
                'uri': entry.uri,
                'id' : entry.sid,
                'name': entry.name,
                'format': entry.type,
                'size': entry.size,
                'date': entry.date
            }
        },
        listView: function() {
            this.view = "list"
            this.queryList();
        },
        uploadWnd: function() {
            this.view = "upload"
        },
        clearWarn : function(){
            this.warnmsg = ""
        },
        clearErr : function() {
            this.errmsg = ""
        },
        clearMsg : function (){
            this.msg = ""
        },
        uploadWnd : function() {
            this.view = "upload";//TODO: 改为弹窗（如果有时间
        },
        normalErrProc: function(xhr, status, err)
        {
            //console.log(xhr);//DEBUG
            if(status == "timeout") alertmsg = "服务器响应超时"
            if(status == "parseerror") alertmsg = "数据错误"
            if(status == "error") {
                if(xhr.status == 403) {
                    this.errmsg = "登录信息过期，请重新登录"
                    localStorage.removeItem('usrNo');
                    localStorage.removeItem('token');
                    setTimeout(()=>top.location.href="login.htm", 2000)
                }
                if(xhr.status == 401) {
                    this.errmsg = "登录信息过期，请重新登录"
                    setTimeout(()=>top.location.href="login.htm", 2000)
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
        removeFold: function(id) {
            $.ajax({
                url: this.apirt + '/index/deleteIndex',
                type: "POST",
                headers: {Authorization: this.token},
                data: {indexNo : id},
                success: (data) => {
                    if(data.code == 1) {
                        this.msg = data.msg;
                        setTimeout(this.clearMsg, 2000);
                        setTimeout(this.backMainDir, 2001);
                    }
                    else if(data.code == -1)
                    {
                        this.errmsg = data.msg;
                    }
                    else this.errmsg = '接口返回结果违反规范'
                },
                error: this.normalErrProc()
            })
        },
        queryItemList: function() {
            $.ajax({
                url: this.apirt + '/attach/queryIndexAttachList',
                type: "POST",
                headers: {'Authorization' : this.token},
                data: {indexNo: this.dirNo},
                success: (data, status, jqXHR) => {
                    if(jqXHR.status == 200) {
                        if(data.code == 1) {
                            console.log(data.obj);//TODO：处理obj

                            if(data.obj.length == 0) {
                                this.fileEntries = null;
                                this.pageRefresh();
                                return;}
                            this.fileEntries = new Array();
                            let i = 0
                            //处理attachBeanList
                            data.obj.forEach(entry => {
                                this.fileEntries.push({
                                    id: i++,
                                    sid: entry.attachNo,
                                    name: entry.attachName,
                                    type: entry.attachType,
                                    size: entry.attachSize,
                                    audit: (entry.auditStatus == 'P')? '通过' : '待审',
                                    uri: entry.attachViewUrl,
                                    date: new Date(+new Date(entry.createTime) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                                })
                            });
                            if(i == 0) this.fileEntries = null;
                            this.pageRefresh();
                        }
                        else if(data.code == -1) {this.warnmsg = "错误：" + data.msg}
                        else {
                            this.errmsg = "接口异常"
                        }
                    }
                },
                error: this.normalErrProc
            })
        },
        backMainDir: function() {
            this.dirNo = null;
            this.queryList()
        },
        queryList : function () {
            if(this.dirNo != null) {
                this.queryItemList();
                return;
            }
            $.ajax({
                url: this.apirt + '/index/queryUserAttachAndIndex',
                type: "POST",
                headers: {'Authorization' : this.token},
                success: (data, status, jqXHR) => {
                    if(jqXHR.status == 200) {
                        if(data.code == 1) {
                            console.log(data.obj);//TODO：处理obj

                            this.fileEntries = new Array();
                            let i = 0
                            //处理attachBeanList
                            data.obj.attachBeanList.forEach(entry => {
                                this.fileEntries.push({
                                    id: i++,
                                    sid: entry.attachNo,
                                    name: entry.attachName,
                                    type: entry.attachType,
                                    size: entry.attachSize,
                                    audit: (entry.auditStatus == 'P')? '通过' : '待审',
                                    uri: entry.attachViewUrl,
                                    date: new Date(+new Date(entry.createTime) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
                                })
                            });
                            if(i == 0) this.fileEntries = null;
                            this.pageRefresh();
                            if(data.obj.indexBeanList.length == 0) return;
                            this.spaceFolders = new Array();
                            //TODO:处理indexBeanList
                            data.obj.indexBeanList.forEach(entry => {
                                this.spaceFolders.push({
                                    id: entry.indexNo,
                                    name: entry.indexName
                                })
                            })
                        }
                        else if(data.code == -1) {this.warnmsg = "错误：" + data.msg}
                        else {
                            this.errmsg = "接口异常"
                        }
                    }
                },
                error: this.normalErrProc
            })
        },
        rni: function(id) {
            if(this.foldRename == '') {
                alert('分类名不能为空');
                return;
            }
            $.ajax({
                url: this.apirt + '/index/updateIndex',
                type: 'POST',
                headers: {
                    Authorization: this.token
                },
                data: {
                    indexName: this.foldRename,
                    indexNo: id
                },
                success: (data) => {
                    if(data.code == 1) {
                        this.queryList();
                        this.msg = data.msg;
                        setTimeout(this.clearMsg, 1000);
                        this.foldRename = '';
                    }
                    else if (data.code == -1) {
                        this.errmsg = data.msg
                    }
                    else alert('接口返回结果违反规范');
                },
                error: this.normalErrProc
            })
        },
        upload : function() {
            //上传文件
            var formData = new FormData();
            var fileList = $('#uploadBox').prop('files');
            if(fileList.length == 0) {
                this.msg = "请选择文件";
                return;
            }
            formData.append("file", fileList[0]);
            if(this.dirNo != "") {
                formData.append('indexNo', this.dirNo);
            }
            $.ajax({
                url: this.apirt + '/attach/upload',
                type: 'POST',
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                headers: {
                    Authorization : this.token
                },
                success: (data, status, jqXHR)=>{
                    if(data.code == 1) {
                        this.msg = "上传成功"
                    }
                    if(data.code == -1) {
                        this.errmsg = data.msg
                    }
                },
                error: this.normalErrProc
            })
        }
    }
})

$('#uploadNav').click(function(){app.uploadWnd()})