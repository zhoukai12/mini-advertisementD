// pages/payment/index.js
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    transaction_id: '', //交易单号
    billType: '', //支付方式
    order_number: '', //商户单号
    payment_time: '', //支付时间
    storeName: '', //商户全称
    isPay: false, //是否支付完成显示订单信息
    isMsg: false, //是否显示错误提示
    msgTips: '', //支付失败错误信息
    status: 'status1', //支付状态图  1为未支付 2为支付失败 3为支付成功
    sn: "",
    merchants_number: '', //门店商户号 
    amount: 0, //支付金额
    merId: '', //登陆用户编号
    isOK: true, //支付方式显示
    cardInfo: {}, //显示会员卡信息
    timeOut: 10,    //支付完成关闭页面倒计时
    timeOutShow: false,  //支付完成关闭页面
    isShowTips: false,  //扫码提示弹窗
    isShowTipsTime: 60,  //扫码提示弹窗倒计时
    isShowVip: false,
  },
  //关闭页面跳转到首页
  closeTimeOut(){
    wx.reLaunch({
      url: app.$routes.index
    })
  },

  //获取订单信息详情
  getDetail(id) {
    var that = this;
    app.$api.getDBillDetail({
      billDetailId: id
    }).then(res => {
      console.log('获取订单信息详情')
      wx.hideLoading();
      that.setData({
        transaction_id: res.data.data.transaction_id,
        billType: res.data.data.billType,
        order_number: res.data.data.order_number,
        payment_time: res.data.data.payment_time,
        storeName: res.data.data.storeName,
        isPay: true,
        status: 'status3',
        isOK: false,
        timeOutShow: true
      },()=>{
        let time = that.data.timeOut;
        console.log(time)
        let timer = setInterval(() => {
          time--;
          if (time == 0) {
            that.closeTimeOut();
            clearInterval(timer)
          }
          that.setData({
            timeOut: time
          })
        }, 1000)
      });
      // 会员支付完成查询订单信息之后重新获取会员信息
      that.getDetail();
    })
  },

  //调用条码支付获取信息
  payCodeToH(code, billtype) {
    console.log("调用支付接口接收的code值 = " + (code || ""));
    let that = this;
    app.$api.payCode({
      "bill_type": billtype || "",
      'code': code || "",
      "merId": app.globalData.merId,
      "merchants_number": app.globalData.merchants_number,
      "number": that.data.amount,
      "sn": app.globalData.sn,
    }).then(resp => {
      console.log('支付成功回调函数 = ',resp)
      if(resp.data.code!=200){
        console.log(resp.data.code)
        console.log(resp.data.msg)
        wx.showToast({
          title: resp.data.msg,
          icon: 'none',
          mask: true,
          duration: 2000
        })
      }else{
        if (resp.data.result_code == 'FAIL') {
          that.setData({
            status: 'status2',
            isMsg: true,
            msgTips: resp.data.result_msg
          })
        } else if (resp.data.result_code == 'SUCCESS') {
          that.getDetail(resp.data.orderId)
          that.loginOut();
        }
      }
      // that.payEnd(resp.data.data);
      // that.sendOutData(content);
    })
  },

  //刷脸支付
  paySL() {
    let that = this;
    //是否能够快速支付
    wxfaceapp.ableToQuickPay({
      success(res) {
        console.log('check facecode suc')
        //快速支付
        wxfaceapp.quickPay({
          requireFaceCode: true, // 需要付款码
          success(res) {
            // 返回的扣款码,requireFaceCode=true时返回
            console.log('ret faceCode = ' + res.faceCode)
            that.payCodeToH(res.faceCode, 'wx_face');
            return
          },
          fail(res) {
            console.log('quickpay failed reply = ' + res.reply)
          }
        })
      },
      fail(res) {
        //获取青蛙相关信息
        wxfaceapp.facePay({
          requireFaceCode: true, //是否需要获取付款码返回给小程序
          success(res) {
            //刷脸成功Event 建议配合facePay的调用结果进行注册
            wxfaceapp.onFacePayPassEvent(function(res) {
              console.log("调用刷脸 = " + res.faceCode) //需要发送到后端请求
              that.payCodeToH(res.faceCode, 'wx_face');
            })
            //刷脸失败Event 建议配合facePay的调用结果进行注册
            wxfaceapp.onFacePayFailedEvent(function(res) {
              // console.log("onFacePayFailedEvent retCode = " + res.replyCode)
            })
          },
          fail(res) {

          }
        })
      }
    })

  },

  //扫码支付
  paySM() {
    let that = this;
    that.setData({
      isShowTips: true,
    })
  
    let time = that.data.isShowTipsTime;
    let timer = setInterval(() => {
      time--;
      if (time == 0) {
        that.loginOut();
        that.closeTimeOut();
        clearInterval(timer)
      }
      that.setData({
        isShowTipsTime: time
      })
    }, 1000)

    //声明监听扫码器
    wxfaceapp.listenCodePayment({
      success(res) {
        //被扫码回调事件
        wxfaceapp.onCodePayEvent(function(res) {
          that.payCodeToH(res.code)
          that.setData({
            isShowTips: false,
            isShowTipsTime: 60,
          })
          clearInterval(timer)
          console.log("onCodePayEvent retCode = " + res.replyCode)
          //被扫码到的具体的码
          console.log("onCodePayEvent code scanned = " + res.code)
        })
      }
    })
  },

  //会员余额支付
  payBalance() {
    let that = this;
    wxfaceapp.faceLogin({
      //开启重复登录
      enableMultiLogin: true,
      //登录成功后，自动路由至此页面
      relaunchUrl: "pages/payment/index",
      success(res) {
        console.log("[faceLogin] success")
        console.log(res.replyCode)
        console.log(res.reply)
        that.getUserIsVip().then(res => {
          if (res == true) {
            app.$api.memberPay({
              "memberId": that.data.cardInfo.id,
              "orderTotal": that.data.amount,
            }).then(res => {
              console.log('会员支付结果 = ', res)
              that.getDetail(resp.data.data.orderId);
              app.postAfterMessage('会员卡余额支付成功');
            })
          } else {
            wx.showToast({
              title: '抱歉，您还不是本店会员~',
              icon: 'none',
              duration: 2000
            })
          }
        }).catch(error => {

        })
      },
      fail(res) {
        console.log("[faceLogin] failed")
        console.log(res.replyCode)
        console.log(res.reply)
      }
    })

  },

  //支付成功推出登陆态
  loginOut() {
    //退出登录
    wxfaceapp.logoutOnFaceApp({
      success(res) {
        //退出登录成功后，小程序和青蛙App用户登录态都将完成注销
        console.log("[faceLogout] suc, msg = " + res.reply)
      },
      fail(res) {
        console.log("[faceLogout] failed, msg = " + res.reply)
      }
    })
  },



  //支付成功像另外一个小程序通知结果
  payEnd(resp) {
    if (!resp.orderId) {
      resp.orderId = 0;
    }
    let content=`{"order_code":"${resp.order_code}","orderId":${resp.orderId}}`;
    this.sendOutData(content);
  },

  //获取当前用户是否是会员
  getUserIsVip() {
    let that = this;
    return new Promise((resolve,reject)=>{
      wxfaceapp.isLoginOnFaceApp({
        success() {
          //成功，说明此时青蛙App具备登录态，可以进行小程序内登录
          console.log("会员卡页有刷脸登录信息")
          wx.getUserInfo({
            success: function (resp) {
              console.log('获取用户授权信息', resp)
              wx.login({
                success(res) {
                  if (res.code) {
                    //发起网络请求
                    app.$api.getCode({
                      "code": res.code,
                      "encryptedData": resp.encryptedData,
                      "iv": resp.iv,
                      "sn": app.globalData.sn
                    }).then(resd => {
                      console.log('登录成功获取会员信息', resd)
                      if (!!resd.data.data.merchantsMember) {
                        that.setData({
                          cardInfo: resd.data.data.merchantsMember,
                          isShowVip: true,
                        })
                        let obj = resd.data.data.merchantsMember;
                        let newObj = { headImg: obj.headImg, integral: obj.integral, balance: obj.balance, couponsNum: obj.couponsNum, wxOpenid: obj.wxOpenid, type: 'getVipinfo', nickName: obj.nickName };
                        that.sendOutData(JSON.stringify(newObj));
                        resolve(true)
                      } else {
                        that.setData({
                          isShowVip: false,
                        });
                        resolve(false)
                      }
                    }).catch(error => {
                      console.log(error)
                      reject(error)
                    })
                  } else {
                    console.log('登录失败！' + res.errMsg)
                    reject(res.errMsg)
                  }
                }
              })
            },
            fail: (res) => {
              console.log(res)
            }
          })
        },
        fail() {
          console.log("会员卡页无刷脸登录信息")
          wxfaceapp.faceLogin({
            //开启重复登录
            enableMultiLogin: true,
            //登录成功后，自动路由至此页面
            relaunchUrl: `pages/payment/index`,
            success(res) {
              console.log("[faceLogin] success")
              console.log(res.replyCode)
              console.log(res.reply)
            },
            fail(res) {
              console.log("[faceLogin] failed")
              console.log(res.replyCode)
              console.log(res.reply)
            }
          })
        }
      })
    })
    
  },
  //封装通知后屏小程序
  sendOut(arr, index) {
    let that = this;
    console.log(index, arr.length)
    if (index >= arr.length) {
      console.log('return')
      return
    }
    wxfaceapp.postMsg({
      targetAppid: app.globalData.afterAppId,
      content: arr[index],
      success(res) {
        console.log(arr[index])
        that.sendOut(arr, index + 1)
      },
      fail(res) {
        that.sendOut(arr, index)
      }
    })
  },
  //通知后屏小程序
  sendOutData(item) {
    let data = item||JSON.stringify(this.data);
    let dataLength = Math.ceil(data.length / 200);
    let arr = [];
    arr.push('reset');
    for (let i = 0; i < dataLength; i++) {
      arr.push(data.substring(i * 200, (i + 1) * 200));
    }
    arr.push('close')
    this.sendOut(arr, 0)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // this.getUserIsVip();
    wxfaceapp.isLoginOnFaceApp({
      success() {
        //成功，说明此时青蛙App具备登录态，可以进行小程序内登录
        console.log("[isAlreadyLogin] is login on face app, free to call [wx.login]")
      },
      fail() {
        //失败，说明此时青蛙App不具备登录态，需要进行刷脸登录获取登录态，然后才可以进行小程序内登录
        console.log("[isAlreadyLogin] not login on face app, free to call [faceLogin]")
      }
    })
    console.log(wxfaceapp)
    //退出登录
    wxfaceapp.exitWithLogout({
      success(res) {
        //退出登录成功后，小程序和青蛙App用户登录态都将完成注销
        console.log("[faceLogout] suc, msg = " + res.reply)

      },
      fail(res) {
        console.log("[faceLogout] failed, msg = " + res.reply)
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    console.log(wxfaceapp)
    console.log('onReady globalData = ',app.globalData)
    this.setData({
      amount: app.globalData.amount
    },()=>{
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})