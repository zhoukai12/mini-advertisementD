//app.js
import {routes} from './utils/routes.js';
import api from './api/index.js';
import utils from './utils/util.js';
App({
  onLaunch: function(options) {
    console.log(options)
    this.globalData.id=options.query.id;
    this.globalData.sn=options.query.sn;
    this.globalData.merchants_number=options.query.merchants_number;
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    // userInfo: null
    afterAppId: 'wx678c13e991929eb4',//后屏小程序的appId
    openId: wx.getStorageSync('openId')||"",
    sn: '',
    merId: '',
    merchants_number: '',
    amount: 0,
    isPhone: true,
  },
  $api: {...api},
  $routes: routes,
  $utils: utils,
  updateTitle(title) { //修改页面标题
    wx.setNavigationBarTitle({
      title
    })
  },
  getAfterMessage() {
    let that = this
    console.log(that.globalData)
    wxfaceapp.onRemoteMessage(function (res) {
      console.log("接受到后屏小程序信息状态码 " + res.replyCode)
      console.log("接受到后屏小程序信息的appId:" + res.senderAppid)
      console.log("接受到后屏小程序信息内容:" + res.content)
      let newObj = JSON.parse(res.content);
      console.log('globalData = ', that.globalData)
      console.log('newObj = ', newObj)
      if (newObj.type == 'store') {
        that.globalData.sn = newObj.sn;
        that.globalData.merId = newObj.merId;
        that.globalData.merchants_number = newObj.merchants;
        that.globalData.amount = newObj.amount;
      } else if (newObj.type == 'pay') {
        that.globalData.sn = newObj.sn;
        that.globalData.merId = newObj.merId;
        that.globalData.merchants_number = newObj.merchants_number;
        that.globalData.amount = newObj.amount;
        wx.navigateTo({
          url: that.$routes.payment,
        })
      }
      that.getAfterMessage()
    })
  },
  postAfterMessage(content) {
    return new Promise((resolve, reject) => {
      wxfaceapp.postMsg({
        targetAppid: this.globalData.afterAppId,
        content: content,
        // content: '123123',
        success(res) {
          resolve(res)
        },
        fail(res) {
          reject(res)
        }
      })
    })
  }
})