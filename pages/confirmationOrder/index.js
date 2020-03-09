// pages/confirmationOrder/index.js
const app = getApp();
let dataString = "";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardInfo: {}, //会员信息
    alreadyPointList: [], //购物车list
    isShowVipBtn: false, //是否显示会员余额支付按钮
    isShowTips: false, //扫码提示弹窗
    isShowTipsTime: 60, //扫码提示弹窗倒计时
    amount: 0, //商品总价格
    openId: '',
    sn: 'TXAP11939002689ND002112',
    merchants_number: '1773508003',
    merId: 104,
    isSweepCode: false,
    addressInfo:null,
  },
  //点击收银按钮
  settleAccounts(){
    let that=this;
    let amount = app.$utils.cartTotalPrice(wx.getStorageSync('alreadyPointList') || []);
    let openId=wx.getStorageSync('openId')
    if(!!app.globalData.id){
      if (!!this.data.addressInfo) {
        that.generateOrder().then(res1=>{
          app.$api.webPay({
            channel: 'wxChat',
            merchants_number: app.globalData.merchants_number,
            number: amount,
            openid: app.globalData.openId,
          }).then(res => {
            //微信支付成功
            console.log(res)
          })
        })
      } else {
        wx.showToast({
          title: '请选择收货地址~',
          icon: 'none',
          duration: 2000,
          mask: true,
        })
      }
    }else{
      //非扫码点餐
      wx.showToast({
        title: '点击支付方式进行付款~',
        icon: 'none',
        mask: true,
        duration: 2000
      })
    }
  },
  //选择收获地址
  chooseAddress(){
    let that=this;
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.address'] == undefined || res.authSetting['scope.address']) {
          console.log(res.authSetting['scope.address'])
          wx.chooseAddress({
            success(res) {
              that.setData({
                addressInfo: res
              })
            }
          })
        } else {
          console.log('拒绝授权 222')
          wx.openSetting({
            success(res) {
              
            }
          })
        }
      }
    })
  },

  //关闭页面跳转到首页
  closeTimeOut() {
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
      }, () => {
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

    })
  },

  //调用条码支付获取信息
  payCodeToH(orderingId, code, billtype) {
    console.log("调用支付接口接收的code值 = " + (code || ""));
    let list = wx.getStorageSync('alreadyPointList')
    let price = app.$utils.cartTotalPrice(list);
    console.log(price)
    let that = this;
    app.$api.payCode({
      orderingId,
      "bill_type": billtype || "",
      'code': code || "",
      "merId": that.data.merId,
      "merchants_number": that.data.merchants_number,
      "number": price,
      "sn": that.data.sn,
    }).then(resp => {
      console.log(resp)
      that.payEnd(resp.data.data);
      if (resp.data.data.result_code == 'FAIL') {
        that.setData({
          status: 'status2',
          isMsg: true,
          msgTips: resp.data.data.result_msg
        })
      } else if (resp.data.data.result_code == 'SUCCESS') {
        that.getDetail(resp.data.data.orderId)
      }
    })
  },

  //生成订单信息
  generateOrder() {
    let that = this;
    return new Promise((resolve, reject) => {
      let list = that.data.alreadyPointList;
      let orderingGoodsVos = list.map((item, index) => {
        return {
          goods_id: item.id,
          goods_standards: item.skuIdList,
          number: item.goodsCount
        }
      })
      app.$api.generateOrder({
        openid: app.globalData.openId || '',
        orderingGoodsVos: orderingGoodsVos
      }).then(res => {
        // res.data.data
        //payMoney  -- 后端返回支付金额
        //orderingId  --  生成订单编号
        console.log(res)
        let {
          payMoney,
          orderingId
        } = res.data.data;
        let amount = app.$utils.cartTotalPrice(wx.getStorageSync('alreadyPointList') || []);
        if (Number(payMoney) == Number(amount)) {
          if(!!app.globalData.id){

          }else{
            wxfaceapp.postMsg({
              targetAppid: app.globalData.afterAppId,
              content: orderingId,
              success(res) {
                console.log('告诉后端订单ID接口成功~')
                // console.log(arr[index])
              },
              fail(res) {

              }
            })
          }
          resolve(res.data.data)
        } else {
          wx.showToast({
            title: '生成订单失败~',
            icon: 'none',
            duration: 2000,
            mask: true,
          })
          reject(res)
        }
      }).catch(res => {
        console.log('生成订单错误信息', res)
        reject(res)
      })
    })

  },

  //刷脸支付
  paySL() {
    let that = this;
    that.generateOrder().then(res1 => {
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
              that.payCodeToH(res1.orderingId, res.faceCode, 'wx_face');
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
                that.payCodeToH(res1.orderingId, res.faceCode, 'wx_face');
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
    })

  },

  //扫码支付
  paySM() {
    let that = this;
    that.generateOrder().then(res1 => {
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
            that.payCodeToH(res1.orderingId, res.code)
            that.setData({
              isShowTips: false,
            })
            clearInterval(timer)
            console.log("onCodePayEvent retCode = " + res.replyCode)
            //被扫码到的具体的码
            console.log("onCodePayEvent code scanned = " + res.code)
          })
        }
      })
    })

  },

  //会员余额支付
  payBalance() {
    let that = this;
    that.generateOrder().then(res => {
      console.log('订单创建成功 = ', res)
      app.$api.memberPay({
        "orderingId": res.orderingId,
        "memberId": that.data.cardInfo.id,
        "orderTotal": that.data.amount,
      }).then(red => {
        console.log('会员支付结果 = ', red)
        that.getDetail(resd.data.data.orderId);
        wxfaceapp.postMsg({
          targetAppid: app.globalData.afterAppId,
          content: '会员卡余额支付成功',
          success(res) {

          },
          fail(res) {

          }
        })
      }).catch(error => {
        console.log(error)
      })
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
    let content = `{"order_code":"${resp.order_code}","orderId":${resp.orderId}}`;
    app.postAfterMessage(content);
  },

  //获取当前用户是否是会员
  getUserIsVip() {
    let that = this;
    wxfaceapp.isLoginOnFaceApp({
      success() {
        //成功，说明此时青蛙App具备登录态，可以进行小程序内登录
        console.log("会员卡页有刷脸登录信息")
        wx.login({
          success(res) {
            if (res.code) {
              wx.getUserInfo({
                success: function (resp) {
                  console.log('获取用户授权信息', resp)
                  //发起网络请求
                  app.$api.getCode({
                    "code": res.code,
                    "encryptedData": resp.encryptedData,
                    "iv": resp.iv,
                    "sn": that.data.sn,
                  }).then(resd => {
                    console.log('登录成功获取会员信息', resd)
                    let amount = app.$utils.cartTotalPrice(wx.getStorageSync('alreadyPointList') || []);
                    let isLarge = resd.data.data.merchantsMember.balance > amount ? true : false
                    if (!!resd.data.data.merchantsMember) {
                      that.setData({
                        openId: resd.data.data.merchantsMember.wxOpenid,
                        amount: amount,
                        isShowVipBtn: isLarge,
                        cardInfo: resd.data.data.merchantsMember,
                        alreadyPointList: wx.getStorageSync('alreadyPointList') || []
                      }, () => {
                        that.sendOutData()
                      })
                    } else {
                      //非会员
                      that.setData({
                        openId: resd.data.data.wxOpenid,
                        amount: amount,
                        isShowVipBtn: false,
                        isSweepCode: false,
                        alreadyPointList: wx.getStorageSync('alreadyPointList') || []
                      }, () => {
                        that.sendOutData()
                      })
                    }
                  }).catch(res => {
                    console.log(res)
                  })
                },
                fail: (res) => {
                  console.log(res)
                }
              })
            } else {
              console.log('登录失败！' + res.errMsg)
            }
          }
        })
        
      },
      fail() {
        console.log("会员卡页无刷脸登录信息")
        wxfaceapp.faceLogin({
          //开启重复登录
          enableMultiLogin: true,
          //登录成功后，自动路由至此页面
          relaunchUrl: `pages/confirmationOrder/index`,
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
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    if (!app.globalData.id) {
      this.getUserIsVip();
      // this.monitorAccept()
    } else {
      this.setData({
        isSweepCode: true,
        alreadyPointList: wx.getStorageSync('alreadyPointList') || [], //已点列表
      })
    }
  },



  //接受后屏小程序信息
  getOtherApp() {
    wxfaceapp.onRemoteMessage(function(res) {
      console.log("接受到后屏小程序信息状态码 " + res.replyCode)
      console.log("接受到后屏小程序信息的appId:" + res.senderAppid)
      console.log("接受到后屏小程序信息内容:" + res.content)
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
  sendOutData() {
    let data = JSON.stringify(this.data);
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
    console.log('unload')
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

  },
  monitorAccept: function () { //监听接收前屏操作的值
    let that = this;
    wxfaceapp.onRemoteMessage(function (res) {
      let burstContent = res.content;
      console.log(burstContent);
      if (burstContent == "close") {
        console.log(dataString);
        let jsonObject = JSON.parse(dataString);
        that.setData(jsonObject, () => {
          dataString = "";
        });
      } else if (burstContent == "reset") {
        dataString = "";
        that.monitorAccept();
      } else if (burstContent == "goNext") {
        wx.navigateTo({
          url: app.$routes.confirmationOrder,
        })
      } else {
        dataString += burstContent;
        that.monitorAccept();
      }
    });
  }
})