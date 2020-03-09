const app = getApp();
const request = function (url, method, params, config = {}) {
  let token = wx.getStorageSync('token') || null;
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '正在加载中......',
      mask: true
    });
    wx.request({
      url: url, //仅为示例，并非真实的接口地址
      data: {
        ...params
      },
      method: method,
      header: {
        'Content-Type': config.contentType || 'application/json',
        // 'Authorization': 'Bearer ' + token,
        'token': token,
      },
      success: res => {
        wx.hideLoading();
        resolve(res);
      },
      fail: res => {
        wx.hideLoading();
        wx.showToast({
          title: '服务器繁忙，请稍后重试~',
          icon: 'none'
        })
        reject(res);
      },
    });
  });
};
module.exports = request;