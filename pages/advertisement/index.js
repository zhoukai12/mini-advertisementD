//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    background: [],
    autoplay: true,
    circular: true,
    interval: 3000,
    previousMargin: 0,
    nextMargin: 0,
    initialTime: 0, //视频初始时间
    current: 0,
    controls: false,
    videoPlay: false,
    loop: true,
  },

  videoEnd(e) {
    console.log(e)
    this.setData({
      autoplay: true,
      videoPlay: false,
      initialTime: 0,
      interval: 100,
      loop: false,
    }, () => {
      let videoContext = wx.createVideoContext('video1');
      // console.log(videoContext)
      videoContext.pause()
    })

  },

  //swiper改变事件
  swiperChange(e) {
    let current = e.detail.current
    if (current == 1) {
      this.setData({
        autoplay: false,
        videoPlay: true,
        loop: true,
      }, () => {
        let videoContext = wx.createVideoContext('video1');
        // videoContext.seek(0)
        setTimeout(() => {
          videoContext.play()
        }, 100)
      })
    } else {
      this.setData({
        interval: 3000,
        videoPlay: false
      })
    }
  },
  catchTouchMove() {},
  //点击立即点餐按钮
  goOrderMeal() {
    // wx.showLoading({
    //   title: '正在加载中......',
    //   mask: true
    // });
    if (app.globalData.id) { //扫码进入
      wx.hideLoading()
      wx.navigateTo({
        url: app.$routes.index,
      })
    } else { //设备进入

      //启动后屏小程序
      wxfaceapp.launchMp({
        appId: app.globalData.afterAppId,
        hostAppId: 'gh_f31628d08c4e',
        miniappType: 2, //小程序版本类型
        launchPage: "pages/index/index",
        needLogin: 0, //是否需要登录态
        success(res) {
          console.log('启动后屏小程序成功')
          app.globalData.isPhone = false;
          let content = {
            'type': 'clickOrder'
          };
          //通知后屏小程序信息
          // setTimeout(() => {
          //   wx.hideLoading();
          //   wx.navigateTo({
          //     url: app.$routes.index,
          //   })
          //   wxfaceapp.postMsg({
          //     targetAppid: app.globalData.afterAppId,
          //     content: JSON.stringify(content),
          //     success(res) {
          //     },
          //     fail(res) {}
          //   })
          // }, 8000)

          wxfaceapp.faceLogin({
            //开启重复登录
            enableMultiLogin: true,
            //登录成功后，自动路由至此页面
            relaunchUrl: app.$routes.index,
            success(res) {
              console.log("[faceLogin] success")
              console.log(res.replyCode)
              console.log(res.reply)
              if (res.replyCode == 0) {
                wx.navigateTo({
                  url: app.$routes.index,
                })
              }
            },
            fail(res) {
              console.log("[faceLogin] failed")
              console.log(res.replyCode)
              console.log(res.reply)
            }
          })



        },
        fail(res) {
          console.log('启动后屏小程序失败 = ' + res.reply)
          // originThz.setData({
          //   launcMpResult: res.reply
          // })
        }
      })
    }
  },
  onLoad() {

  },
  onReady() {
    if (app.globalData.id) { //扫码进入

    } else { //设备进入
      //启动后屏小程序
      // wxfaceapp.launchMp({
      //   appId: app.globalData.afterAppId,
      //   hostAppId: 'gh_f31628d08c4e',
      //   miniappType: 2, //小程序版本类型
      //   launchPage: "pages/index/index",
      //   needLogin: 0, //是否需要登录态
      //   success(res) {
      //     console.log('启动后屏小程序成功');
      app.getAfterMessage();
      // },
      // fail(res) {
      //   console.log('启动后屏小程序失败 = ' + res.reply)
      //   // originThz.setData({
      //   //   launcMpResult: res.reply
      //   // })
      // }
      // })
    }
  },
  onShow() {

  }

})