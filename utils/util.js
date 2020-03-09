const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//循环遍历购物车 拿到sku对应
const skuExample=(arr,sku)=>{
  let _index;
  arr.map((item,index)=>{
    if (item.sku == sku){
      _index=index;
    }else{
      _index=-1;
    }
  })
  return _index
}

//修改购物车中的数据
const updateCart = (food, _index, targetGoodsCount, list)=>{
  // debugger
  food.goodsCount = targetGoodsCount;
  // 当_index == -1时，表示购物车无该商品
  if (_index == -1) {
    list.unshift(food);
  } else if (targetGoodsCount == 0) {
    list.splice(_index, 1);
  } else {
    list[_index] = food;
  }
  return list;
}


//选择规格展示对应的选中文案
const  textOptions =  (arr) =>{
  let text = '';
  let ggList = [];
  arr.map(function (item) {
    item.options.map(function (obj) {
      if (obj.isSelected == 1) {
        text = text + obj.value+' ';
        ggList.push(obj.id)
      }
    })
  })
  return {text,ggList};
}



//去重相加
const deEmphasis = (arr)=>{
  let newArr = [];
  for (let iterator of arr) {
    var isNew = true;
    for (let i in newArr) {
      if (newArr[i].id == iterator.id) {
        newArr[i].name = iterator.name;
        newArr[i].goodsCount += iterator.goodsCount;
        isNew = false;
        break;
      }
    }
    if (isNew) { newArr.push(iterator); }
  }
  return newArr
}

// 购物车商品价格计算
const cartTotalPrice = function (cartList, isMember = 0) {
  let result = 0;
  cartList.map(function (item) {
    result += (item.goodsCount * (item.goodsDiscountPrice*100))
  })
  result = result/100;
  return result.toFixed(2);
}



module.exports = {
  formatTime: formatTime,
  deEmphasis: deEmphasis,
  skuExample: skuExample,
  updateCart: updateCart,
  textOptions: textOptions,
  cartTotalPrice: cartTotalPrice,
}
