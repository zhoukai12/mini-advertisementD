Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#3cc51f",
    list: [{
        pagePath: "/pages/index/index",
        iconPath: "/images/icon1.png",
        selectedIconPath: "/images/icon2.png",
        text: "点餐",
        $index: 0,
      },
      {
        pagePath: "/pages/discount/index",
        iconPath: "/images/icon3.png",
        selectedIconPath: "/images/icon4.png",
        text: "订单",
        $index: 1
      }
    ]
  },
  attached() {},
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      console.log(data.$index)
      const url = data.path;
      const pages = getCurrentPages();
      const currentPageRoute = `/${pages[pages.length - 1].route}`;
      if (currentPageRoute != url) {
        wx.switchTab({
          url
        })
        // this.setData({
        //   selected: data.$index
        // })
      }
    }
  }
})