<template>
  <view class="product-detail-container">
    <!-- 商品图片 -->
    <view class="product-image">
      <text class="product-emoji">{{ getProductIcon(product?.category) }}</text>
    </view>

    <!-- 商品信息 -->
    <view class="product-info-card">
      <view class="price-row">
        <text class="price">¥{{ product?.price || 0 }}</text>
        <text class="stock">库存: {{ product?.stock || 0 }}</text>
      </view>
      <text class="product-name">{{ product?.name || '加载中...' }}</text>
      <text class="product-desc">{{ product?.description || '暂无描述' }}</text>
      <view v-if="product?.category" class="category-tag">
        <text>{{ product.category }}</text>
      </view>
    </view>

    <!-- 购买区域 -->
    <view class="action-bar">
      <view class="quantity-control">
        <view class="qty-btn" @click="decreaseQty">-</view>
        <text class="qty-value">{{ quantity }}</text>
        <view class="qty-btn" @click="increaseQty">+</view>
      </view>
      <button class="buy-btn" :loading="loading" @click="handleBuy">
        立即购买
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getProductDetail, type Product } from '@/api/product'
import { createAlipayPayment } from '@/api/payment'
import { useUserStore } from '@/stores/user'

/** 商品信息 */
const product = ref<Product | null>(null)

/** 购买数量 */
const quantity = ref(1)

/** 加载状态 */
const loading = ref(false)

/** 用户Store */
const userStore = useUserStore()

/**
 * 初始化
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    loadProduct(parseInt(currentPage.options.id))
  }
})

/**
 * 加载商品详情
 */
const loadProduct = async (id: number) => {
  try {
    const data = await getProductDetail(id)
    product.value = data
  } catch (error) {
    console.error('加载商品失败:', error)
    uni.showToast({ title: '商品不存在', icon: 'none' })
  }
}

/**
 * 增加数量
 */
const increaseQty = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

/**
 * 减少数量
 */
const decreaseQty = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

/**
 * 获取商品图标
 */
const getProductIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    '食品': '🍖',
    '玩具': '🎾',
    '用品': '🦴',
    '服饰': '👕',
    '药品': '💊'
  }
  return icons[category || ''] || '📦'
}

/**
 * 购买商品
 */
const handleBuy = async () => {
  if (!product.value) return
  if (!userStore.checkAuth()) return

  const totalPrice = product.value.price * quantity.value

  uni.showModal({
    title: '确认购买',
    content: `商品: ${product.value.name}\n数量: ${quantity.value}\n总价: ¥${totalPrice}`,
    success: async (res) => {
      if (res.confirm) {
        loading.value = true
        try {
          uni.showLoading({ title: '创建订单...' })
          
          const paymentRes = await createAlipayPayment({
            amount: totalPrice,
            subject: `${product.value!.name} x${quantity.value}`,
            description: product.value!.description,
            related_id: product.value!.id,
            related_type: 'product'
          })

          uni.hideLoading()

          if (paymentRes.pay_url) {
            // H5环境
            // #ifdef H5
            window.open(paymentRes.pay_url, '_blank')
            uni.showToast({ title: '请在新窗口完成支付', icon: 'none', duration: 3000 })
            // #endif
            
            // 小程序环境
            // #ifdef MP
            uni.showModal({
              title: '支付提示',
              content: '请在浏览器中完成支付',
              showCancel: false
            })
            // #endif
          }
        } catch (error) {
          uni.hideLoading()
          console.error('创建支付失败:', error)
        } finally {
          loading.value = false
        }
      }
    }
  })
}
</script>

<style lang="scss">
.product-detail-container {
  min-height: 100vh;
  background: #FFFDE7;
  padding-bottom: 160rpx;
}

.product-image {
  height: 500rpx;
  background: linear-gradient(135deg, #FFF9C4, #FFFDE7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-emoji {
  font-size: 200rpx;
}

.product-info-card {
  margin: -60rpx 30rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
  position: relative;
}

.price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.price {
  font-size: 48rpx;
  font-weight: 700;
  color: #FF6D00;
}

.stock {
  font-size: 26rpx;
  color: #BDBDBD;
}

.product-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #212121;
  margin-bottom: 16rpx;
}

.product-desc {
  display: block;
  font-size: 28rpx;
  color: #757575;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.category-tag {
  display: inline-flex;
  background: linear-gradient(135deg, #FFF9C4, #FFE57F);
  padding: 10rpx 24rpx;
  border-radius: 20rpx;
  
  text {
    font-size: 24rpx;
    color: #212121;
  }
}

/* 操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 40rpx;
  padding: 8rpx;
}

.qty-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #212121;
}

.qty-value {
  width: 60rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #212121;
}

.buy-btn {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
  box-shadow: 0 8rpx 24rpx rgba(255, 214, 0, 0.3);
}
</style>
