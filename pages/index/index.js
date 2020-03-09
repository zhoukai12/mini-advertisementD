//index.js
//获取应用实例
const app = getApp()
let dataString = '';

Page({
  data: {
    labelList: [], //左边测导航的list
    showDia: false, //购物车底层操作浮层是否展示 false为为展示,
    tabCurrIndex: 0, //左边测导航的展示下标,
    current: 0, //当前请求的页面数据
    size: 10, //每次请求几条数据
    classId: 1, //当前请求的分类ID
    total: 0, //数据的总条数
    foodList: [

    ], //右侧展示对应的餐品列表
    specifications: false, //规格弹层是否展示
    alreadyPointList: [], //已点列表
    specificationsItem: {}, //规格弹窗中的数据
    temporary: 1, //选择规格的临时数量
    maskTime: false, //信息同步弹窗
    userInfo: null, //用户信息
    isSweepCode: false, //是否是扫码点餐
  },
  //跳转下单页面
  goSettleAccounts() {
    let that = this;
    if (that.data.alreadyPointList.length) {
      // 向另一端屏幕上的小程序发送消息
      if (!app.globalData.id) {
        wxfaceapp.postMsg({
          targetAppid: app.globalData.afterAppId,
          content: "goNext",
          success(res) {

          },
          fail(res) {
            console.log('sendMsgResult failed reply = ' + res.reply)
          }
        })
      }
      wx.navigateTo({
        url: app.$routes.confirmationOrder,
      })
    } else {
      wx.showToast({
        title: '请先选择商品之后进行下单~',
        icon: 'none',
        duration: 2000
      })
    }
  },

  //授权登录
  bindGetUserInfo(e) {
    let that = this;
    that.setData({
      userInfo: e.detail.userInfo,
    })
    wx.login({
      success(res) {
        if (res.code) {
          //发起网络请求
          app.$api.getCode({
            "code": res.code,
            "encryptedData": e.encryptedData,
            "iv": e.iv,
            "sn": app.globalData.sn,
          }).then(resd => {
            wx.setStorageSync('openId', resd.data.data.merchantsMember.wxOpenid);
            app.globalData.openId = resd.data.data.merchantsMember.wxOpenid;
          }).catch(res => {
            console.log(res)
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },

  //判断是否登录
  isLogin() {
    let that = this;
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo'] == undefined || res.authSetting['scope.userInfo']) {
          //授权成功
          wx.getUserInfo({
            success: function(res) {
              that.setData({
                userInfo: res.userInfo,
              })
            }
          })
        } else {
          console.log('拒绝授权 222')
          that.setData({
            userInfo: null,
          })
        }
      }
    })
  },

  //减少购物车商品(页面中直接操作食物列表)
  reduceShop(e) {
    let food = e.currentTarget.dataset.item;
    for (let i = 0; i < food.standards.length; i++) {
      if (food.standards[i]["children"].length <= 1) {
        food.skuId = food.standards[0]['children'][0]['standardsName']
        food.skuIdList = food.standards[0]['children'][0]['id']
        this.addFoodToCart(food, 'sub');
        return
      }
    }
    wx.showToast({
      title: '有规格商品请在购物车中操作~',
      icon: 'none'
    })
  },

  //修改购物车中的列表
  addFoodToCart(food, type, num) {
    let list = wx.getStorageSync('alreadyPointList') || [];
    let addNum = num || 0; //是否自定义数量添加
    let goodsCount = 0; //目标数量  默认为0
    let _index = -1; //sku实例在购物车中的下标  默认为-1不存在
    //对购物车进行遍历
    list.map((item, index) => {
      //判断sku实例的ID是否和购物车中的匹配
      if (item.skuIdList == food.skuIdList) {
        goodsCount = item.goodsCount; //sku实例的数量==购物车中的数量
        _index = index;
      }
    })

    if (type == 'add') {
      if (addNum) {
        goodsCount = goodsCount + addNum
      } else {
        goodsCount++;
      }
    } else if (type == 'sub') {
      goodsCount--;
    }

    let newList = app.$utils.updateCart(food, _index, goodsCount, list);
    wx.setStorageSync('alreadyPointList', newList);
    this.setData({
      alreadyPointList: newList
    }, () => {
      console.log('购物车中添加删除商品')
      this.sendOutData()
    });
  },

  //规格选择
  specificationSelection(e) {
    let parentIndex = e.currentTarget.dataset.parindex; //对应的规格总称
    let currIndex = e.currentTarget.dataset.index; //对应规格下的下标
    let id = e.currentTarget.dataset.id; //对应规格的ID
    console.log(parentIndex, currIndex)
    let list = this.data.specOptions; //点击添加生成的规格和详情
    let newChoice;
    if (list[parentIndex]['isCheck']) {
      //多选
      newChoice = list[parentIndex]['options'].map((item) => {
        return item
      })
    } else {
      //单选
      newChoice = list[parentIndex]['options'].map((item) => {
        item['isSelected'] = 0; //设置规格下的选项的选中状态为空
        return item
      })
    }
    list[parentIndex]['options'] = newChoice;
    console.log(list)
    let newSpecOptions = list.map((item, index) => {
      if (index == parentIndex) {
        console.log(item.options[currIndex]['isSelected'])
        if (item.options[currIndex]['isSelected'] == 1) {
          item.options[currIndex]['isSelected'] = 0;
          for (let i = 0; i < item.options.length; i++) {
            if (item.options[i]['isSelected']) {
              item['isSelected'] = 1;
            } else {
              item['isSelected'] = 0;
            }
          }
        } else {
          item.options[currIndex]['isSelected'] = 1;
          item['isSelected'] = 1;
        }
      }
      return item
    })
    this.setData({
      specOptions: newSpecOptions
    }, () => {
      this.sendOutData()
    })

  },
  //规则数量
  guigeAdd(e) {
    this.setData({
      temporary: this.data.temporary + 1,
    }, () => {
      this.sendOutData()
    })
  },
  guigeSub() {
    if (this.data.temporary > 1) {
      this.setData({
        temporary: this.data.temporary - 1,
      }, () => {
        this.sendOutData()
      })
    }
  },
  //确定规格之后添加
  quBtn() {
    let list = app.$utils.textOptions(this.data.specOptions);
    this.data.specificationsItem['skuId'] = list.text;
    this.data.specificationsItem['skuIdList'] = list.ggList.join(',');
    let isOk = this.data.specOptions.some((currentValue) => {
      return !currentValue['isSelected']
    })
    if (isOk) {
      wx.showToast({
        title: '请选择规格~',
        icon: 'none'
      })
    } else {
      this.setData({
        specifications: false
      }, () => {
        this.addFoodToCart(this.data.specificationsItem, 'add', this.data.temporary);
      })
    }
  },

  //购物车中减少操作
  shopSub(e) {
    this.addFoodToCart(e.currentTarget.dataset.item, 'sub');
  },
  //购物车中直接增加
  shopAdd(e) {
    this.addFoodToCart(e.currentTarget.dataset.item, 'add');
  },

  //添加商品到购物车
  addShop(e) {
    let food = e.currentTarget.dataset.item;
    for (let i = 0; i < food.standards.length; i++) {
      if (food.standards[i]["children"].length <= 1) {
        food.skuId = food.standards[0]['children'][0]['standardsName']
        food.skuIdList = food.standards[0]['children'][0]['id']
        this.addFoodToCart(food, 'add');
        return
      }
    }
    let specOptions = [];
    food.standards.map(item => {
      let options = []
      item.children.map(spec => {
        options.push({
          value: spec.standardsName,
          isSelected: 0,
          id: spec.id
        })
      })
      specOptions.push({
        label: item.standardsType,
        options: options,
        isCheck: item.selectMultipleSt
      })
    })
    this.setData({
      specOptions, //当前的规格数组 [{label:"加料",options:["布丁,"椰果"]}]
      specificationsItem: food, //规格弹窗中的数据
      specifications: true, //规格弹层是否展示
      temporary: 1, //当前选中的数量
    }, () => {
      this.sendOutData()
    })
  },

  //切换左侧导航选中
  changeLabel(e) {
    let id = e.currentTarget.dataset.id
    this.setData({
      classId: id,
      current: 0,
      size: 10,
      foodList: [],
    }, () => {
      this.getGoodsById(0, 10, this.data.classId);
    })
  },
  //滚动到底部
  scrolltolower() {
    let {
      current,
      size,
      classId,
      total
    } = this.data;
    if (total <= (current + 1) * 10) {
      wx.showToast({
        title: '已经到底了~',
        icon: 'none'
      })
    } else {
      this.setData({
        current: current + 1
      })
      this.getGoodsById(((current + 1) * 10), size, classId);
    }
  },

  //关闭购物车操作弹层
  hideShowDia() {
    this.setData({
      showDia: false,
      specifications: false
    }, () => {
      this.sendOutData()
    })
  },
  //显示购物车操作弹层
  showDia() {
    if (!this.data.alreadyPointList.length) {
      return
    }
    this.setData({
      showDia: !this.data.showDia,
    }, () => {
      this.sendOutData()
    })
  },
  //阻止冒泡
  stopBubbles() {
    return
  },

  //删除全部购物车商品
  deleteAll() {
    //请求之后关闭浮层
    this.setData({
      alreadyPointList: [],
      showDia: false
    }, () => {
      this.sendOutData()
    })
    wx.setStorageSync('alreadyPointList', [])
  },

  //获取商品分类信息
  getGoodsSort() {
    app.$api.getGoodsSort().then(res => {
      this.setData({
        labelList: res.data.data,
        classId: res.data.data[0]['id']
      }, () => {
        let {
          current,
          size,
          classId
        } = this.data;
        this.getGoodsById(current, size, classId);
      })
    })
  },
  getGoodsById(current, size, classId) {
    app.$api.getGoodsById({
      current,
      size,
      classId
    }).then(res => {
      let newList = JSON.parse(JSON.stringify(this.data.foodList));
      newList.push(...res.data.data.data)
      this.setData({
        foodList: newList,
        total: res.data.data.count
      }, () => {
        this.sendOutData();
      })
    })
  },

  //封装通知后屏小程序
  sendOut(arr, index) {
    let that = this;
    if (index >= arr.length) {
      return
    }
    wxfaceapp.postMsg({
      targetAppid: app.globalData.afterAppId,
      content: arr[index],
      success(res) {
        that.sendOut(arr, index + 1)
      },
      fail(res) {
        that.sendOut(arr, index)
      }
    })
  },
  //通知后屏小程序
  sendOutData() {
    if (!app.globalData.id) {
      let data = JSON.stringify(this.data);
      let dataLength = Math.ceil(data.length / 200);
      let arr = [];
      arr.push('reset');
      for (let i = 0; i < dataLength; i++) {
        arr.push(data.substring(i * 200, (i + 1) * 200));
      }
      arr.push('close')
      this.sendOut(arr, 0)
    }
  },

  onLoad: function() {
    this.getGoodsSort();
  },
  onReady: function() {
    this.isLogin();
    if (!app.globalData.id) { //设备点餐
      // this.monitorAccept();
      // this.setData({
      //   isSweepCode: true,
      // })
    } else {   //扫码点餐
      this.setData({
        isSweepCode: true,
      })
    }
    // this.sendOutData();
  },

  onShow: function() {
    this.setData({
      alreadyPointList: wx.getStorageSync('alreadyPointList') || [], //已点列表
    })
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  getUserInfo: function(e) {

  },
  monitorAccept: function() { //监听接收前屏操作的值
    let that = this;
    wxfaceapp.onRemoteMessage(function(res) {
      let burstContent = res.content;
      console.log('burstContent',burstContent)
      if (burstContent == "close") {
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