if (CC_EDITOR) {
  if (!Editor.CocosService_tcbDemo) {
    Editor.CocosService_tcbDemo = true;
    Editor.log("欢迎使用腾讯云 TCB 小游戏联机对战引擎服务！");
    Editor.log("这是一个简单的 TCB 示例 Demo，通过本示例您可以快速了解如何使用 TCB 来实现云开发服务！");
  }
}

cc.Class({
  extends: cc.Component,

  properties: {
    btnInit: {
      default: null,
      type: cc.Button
    },
    btnCallFunc: {
      default: null,
      type: cc.Button
    },
    btnGetDb: {
      default: null,
      type: cc.Button
    },
    btnSubmitDb: {
      default: null,
      type: cc.Button
    },
    logListView: {
      default: null,
      type: cc.ScrollView
    },
    itemTemplate: {
      default: null,
      type: cc.Node
    },
    cacertFile: {
      default: null,
      type: cc.Asset
    },
    lang: "zh",
    logs: []
  },

  onLoad: function () {
    this.btnInit.interactable = true;
    this.btnCallFunc.interactable = false;
    this.btnGetDb.interactable = false;
    this.btnSubmitDb.interactable = false;

    this.lang = cc.sys.language;
  },

  onDestroy: function () { },

  initMultiLang: function () {
    if (this.lang === cc.sys.LANGUAGE_CHINESE) { } else if (this.lang === cc.sys.LANGUAGE_ENGLISH) { }
  },

  init: function () {
    if (!cc.cloud) {
      CC_EDITOR && Editor.log("请先在Cocos Service面板中启用云服务");
      this.printLog("请先在Cocos Service面板中启用云服务");
      return;
    }
    // 初始化方法，从配置文件中读取参数
    this.app = cc.cloud && cc.cloud.initialize();

    let auth = this.app.auth();
    auth.anonymousAuthProvider().signIn().then(res => {
      // 需要先做授权，云函数才能正常调用，本例子中使用匿名登录方式访问云开发资源，返回后可视为初始化完成
      // 建议后期改为授权登录模式，
      this.printLog("TCB inited");
      console.log('TCB inited');

      this.btnInit.interactable = false;
      this.btnCallFunc.interactable = true;
      this.btnGetDb.interactable = true;
      this.btnSubmitDb.interactable = true;
    });
  },

  callCloudFunction: function () {
    this.app.callFunction({
      // 云函数名称，要与上传的函数名一致
      name: "function",
      // 传给云函数的参数
      data: {
        //data内的参数可以自定义，本例子中使用 action 作为方法名，param 中传递参数，与云函数中使用的参数需要一致
        action: 'send',
        a: 1
      }
    }).then(res => {
      this.printLog('call func, receive ' + res.result.data);
      console.log('call func, receive ', res);
    }).catch(console.error);
  },

  getFromDatabase: function () {
    this.app.callFunction({
      name: 'function',
      data: {
        //data内的参数可以自定义，本例子中使用 action 作为方法名，param中传递参数，与云函数中使用的参数需要一致
        action: 'getData',
        param: {
          showCount: 20, //最大获取条数，本参数可自定义
          sortFiled: 'score' //score 为排序用字段
        }
      }
    }).then(res => {
      if (res.result.status === 0 && res.result.data) {
        this.printLog('get data, count = ' + res.result.data.length);
        console.log('get data ', res);
      }
      else {
        this.printLog('get data failed, ' + res.result.msg);
        console.log('get data failed', res);
      }
    }).catch(console.error);
  },

  submitToDatabase: function () {
    let randNum = Math.floor(Math.random() * 100);
    let data = {
      user_id: 'user' + randNum, //用户ID，云函数中需要判断该值为唯一值
      nick_name: 'test-' + randNum,
      score: 100 + randNum // score 在云函数中用于排序
    };

    this.app.callFunction({
      name: 'function',
      data: {
        action: 'submitData',
        param: data
      }
    }).then(res => {
      if (res.result.status === 0) {
        this.printLog('submit data, ' + res.result.msg);
        console.log('submit data', res);
      }
      else {
        this.printLog('submit data failed, ' + res.result.msg);
        console.log('submit data failed', res);
      }
    }).catch(console.error);;
  },

  printCode: function (code) {
    this.printLog("   ");
    this.printLog("---------- Sample code start ----------");
    this.printLog(code);
    this.printLog("---------- Sample code end   ----------");
    this.printLog("   ");
  },

  printLog: function (info) {
    if (this.logs.length > 20) this.logs = [];
    this.logs.push(info);
    var totalCount = this.logs.length;
    this.logListView.content.removeAllChildren(true);
    for (var i = 0; i < totalCount; i++) {
      var item = cc.instantiate(this.itemTemplate);
      this.logListView.content.addChild(item);
      item.getComponent('Item').updateItem(this.logs[i]);
    }
    this.logListView.scrollToBottom(0.1);
  },

  // called every frame
  update: function (dt) {

  },
});
