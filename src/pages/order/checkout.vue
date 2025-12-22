<template>
  <view class="checkout-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">确认订单</text>
      <view class="placeholder-btn"></view>
    </view>

    <!-- 商品信息 -->
    <view class="section product-section">
      <text class="section-title">商品信息</text>
      <view class="product-card">
        <view class="product-icon">
          <text>{{ productIcon }}</text>
        </view>
        <view class="product-info">
          <text class="product-name">{{ productName }}</text>
          <text class="product-spec">数量: {{ quantity }}</text>
        </view>
        <view class="product-price">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ formatPrice(productAmount) }}</text>
        </view>
      </view>
    </view>

    <!-- 积分抵扣区域 -->
    <view class="section points-section">
      <view class="section-header">
        <text class="section-title">积分抵扣</text>
        <text class="available-points">可用{{ userPoints }}积分</text>
      </view>

      <!-- 使用积分开关 -->
      <view class="points-toggle-card">
        <view class="toggle-left">
          <text class="toggle-icon">💎</text>
          <view class="toggle-info">
            <text class="toggle-title">使用积分抵扣</text>
            <text class="toggle-desc">100积分 = 1元</text>
          </view>
        </view>
        <switch 
          :checked="usePoints" 
          @change="handlePointsToggle"
          color="#6366F1"
        />
      </view>

      <!-- 积分抵扣详情 -->
      <view v-if="usePoints" class="points-detail-card">
        <!-- 积分滑块 -->
        <view class="points-slider-section">
          <text class="slider-label">使用积分</text>
          <view class="slider-wrapper">
            <slider 
              :value="selectedPoints"
              :min="0"
              :max="maxAvailablePoints"
              :step="100"
              @change="handlePointsChange"
              activeColor="#6366F1"
              backgroundColor="#E5E7EB"
              block-size="20"
            />
          </view>
          <view class="points-value">
            <text class="points-num">{{ selectedPoints }}</text>
            <text class="points-unit">积分</text>
          </view>
        </view>

        <!-- 抵扣金额显示 -->
        <view class="discount-display">
          <text class="discount-label">抵扣金额</text>
          <text class="discount-value">-¥{{ pointsDiscount.toFixed(2) }}</text>
        </view>

        <!-- 规则提示 -->
        <view class="points-tips">
          <text class="tip-text">• 100积分起用，100的倍数</text>
          <text class="tip-text">• 最多抵扣订单金额的50%</text>
        </view>
      </view>
    </view>

    <!-- 金额明细 -->
    <view class="section amount-section">
      <text class="section-title">金额明细</text>
      <view class="amount-card">
        <view class="amount-row">
          <text class="amount-label">商品金额</text>
          <text class="amount-value">¥{{ formatPrice(productAmount) }}</text>
        </view>
        <view v-if="memberDiscount > 0" class="amount-row discount-row">
          <text class="amount-label">{{ memberLevel?.name || '会员' }}折扣</text>
          <text class="amount-value discount">-¥{{ memberDiscount.toFixed(2) }}</text>
        </view>
        <view v-if="usePoints && pointsDiscount > 0" class="amount-row discount-row">
          <text class="amount-label">积分抵扣</text>
          <text class="amount-value discount">-¥{{ pointsDiscount.toFixed(2) }}</text>
        </view>
        <view class="amount-divider"></view>
        <view class="amount-row total-row">
          <text class="amount-label">应付金额</text>
          <view class="total-price">
            <text class="price-symbol">¥</text>
            <text class="price-value">{{ formatPrice(finalAmount) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar glass">
      <view class="price-info">
        <text class="price-label">合计</text>
        <view class="price-total">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ formatPrice(finalAmount) }}</text>
        </view>
      </view>
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        <text>提交订单</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { createAlipayPayment } from '@/api/payment'
import { usePointsForOrder } from '@/api/points'

/** 用户Store */
const userStore = useUserStore()

/** 商品信息（从上一页传递） */
const productId = ref(0)
const productName = ref('')
const productIcon = ref('📦')
const quantity = ref(1)
const productAmount = ref(0)

/** 用户积分 */
const userPoints = computed(() => userStore.userInfo?.points || 0)

/** 会员等级信息 */
const memberLevel = computed(() => userStore.userInfo?.member_level)

/** 会员折扣率（0.9表示9折） */
const memberDiscountRate = computed(() => {
  const rate = memberLevel.value?.discount_rate
  if (rate && rate < 1) return rate
  return 1 // 无折扣
})

/** 会员折扣金额 */
const memberDiscount = computed(() => {
  if (memberDiscountRate.value >= 1) return 0
  return productAmount.value * (1 - memberDiscountRate.value)
})

/** 会员折扣后的价格（用于计算积分抵扣上限） */
const priceAfterMemberDiscount = computed(() => {
  return productAmount.value - memberDiscount.value
})

/** 是否使用积分 */
const usePoints = ref(false)

/** 选择的积分数量 */
const selectedPoints = ref(0)

/** 最大可用积分（基于会员折扣后价格计算） */
const maxAvailablePoints = computed(() => {
  // 最多抵扣订单金额的50%（基于会员折扣后价格）
  const maxDiscount = priceAfterMemberDiscount.value * 0.5
  const maxPoints = Math.floor(maxDiscount * 100)
  
  // 不能超过用户拥有的积分
  const available = Math.min(maxPoints, userPoints.value)
  
  // 必须是100的倍数
  return Math.floor(available / 100) * 100
})

/** 积分抵扣金额 */
const pointsDiscount = computed(() => {
  if (!usePoints.value || selectedPoints.value === 0) return 0
  return selectedPoints.value / 100
})

/** 最终应付金额（原价 - 会员折扣 - 积分抵扣） */
const finalAmount = computed(() => {
  const amount = productAmount.value - memberDiscount.value - pointsDiscount.value
  return Math.max(0.01, amount) // 至少0.01元
})

/** 加载状态 */
const loading = ref(false)

/**
 * 初始化
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage?.options || {}
  
  productId.value = parseInt(options.productId) || 0
  productName.value = decodeURIComponent(options.productName || '')
  productIcon.value = decodeURIComponent(options.productIcon || '📦')
  quantity.value = parseInt(options.quantity) || 1
  productAmount.value = parseFloat(options.amount) || 0
})

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 格式化价格
 */
const formatPrice = (price: number): string => {
  return price.toFixed(2)
}

/**
 * 处理积分开关切换
 */
const handlePointsToggle = (e: any) => {
  usePoints.value = e.detail.value
  
  if (usePoints.value) {
    // 打开积分抵扣时，默认使用最大可用积分
    selectedPoints.value = maxAvailablePoints.value
  } else {
    selectedPoints.value = 0
  }
}

/**
 * 处理积分滑块变化
 */
const handlePointsChange = (e: any) => {
  const value = e.detail.value
  // 确保是100的倍数
  selectedPoints.value = Math.floor(value / 100) * 100
}

/**
 * 提交订单
 */
const handleSubmit = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    uni.showLoading({ title: '创建订单...' })
    
    // 如果使用积分，先调用积分抵扣接口
    let pointsUsed = 0
    if (usePoints.value && selectedPoints.value > 0) {
      try {
        // 暂时使用productId作为orderId，实际应该在订单创建后使用真实orderId
        // 这里我们先创建支付，成功后再扣积分
        pointsUsed = selectedPoints.value
      } catch (error: any) {
        uni.hideLoading()
        uni.showToast({ 
          title: error.message || '积分抵扣失败', 
          icon: 'none' 
        })
        loading.value = false
        return
      }
    }
    
    // 创建支付订单
    const productInfo = {
      product_id: productId.value,
      quantity: quantity.value,
      points_used: pointsUsed,
      points_discount: pointsDiscount.value
      // 会员折扣由后端根据用户等级自动计算，无需前端传递
    }
    
    const paymentRes = await createAlipayPayment({
      amount: finalAmount.value,
      subject: `${productName.value} x${quantity.value}`,
      description: JSON.stringify(productInfo),
      related_id: productId.value,
      related_type: 'product'
    })

    uni.hideLoading()

    // 跳转支付页面
    if (paymentRes.pay_url) {
      if (paymentRes.pay_url.includes('/pages/payment/mock')) {
        // Mock支付
        const url = new URL(paymentRes.pay_url)
        const outTradeNo = url.searchParams.get('out_trade_no') || paymentRes.out_trade_no
        
        // 如果使用了积分，将积分信息传递给支付页面
        const mockUrl = `/pages/payment/mock?out_trade_no=${outTradeNo}${pointsUsed > 0 ? `&points_used=${pointsUsed}` : ''}`
        
        uni.redirectTo({ url: mockUrl })
      } else {
        // 真实支付
        const payUrl = encodeURIComponent(paymentRes.pay_url)
        const returnUrl = encodeURIComponent('/pages/order/list')
        
        uni.redirectTo({
          url: `/pages/payment/pay?payUrl=${payUrl}&outTradeNo=${paymentRes.out_trade_no}&amount=${finalAmount.value}&returnUrl=${returnUrl}${pointsUsed > 0 ? `&points_used=${pointsUsed}` : ''}`
        })
      }
    }
  } catch (error: any) {
    uni.hideLoading()
    console.error('创建支付失败:', error)
    uni.showToast({ 
      title: error.message || '创建订单失败', 
      icon: 'none' 
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.checkout-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding-bottom: 180rpx;
}

/* 顶部导航 */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 2rpx solid #F1F5F9;
  }
}

.back-btn {
  width: 72rpx;
  height: 72rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  
  text {
    font-size: 40rpx;
    color: #1E293B;
  }
}

.placeholder-btn {
  width: 72rpx;
  height: 72rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
}

/* 区块样式 */
.section {
  padding: 32rpx 40rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.available-points {
  font-size: 24rpx;
  color: #6366F1;
  font-weight: 600;
}

/* 商品卡片 */
.product-section {
  margin-top: calc(var(--status-bar-height, 44px) + 130rpx);
}

.product-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.product-icon {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 56rpx;
  }
}

.product-info {
  flex: 1;
}

.product-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.product-spec {
  font-size: 24rpx;
  color: #9CA3AF;
}

.product-price {
  display: flex;
  align-items: baseline;
  
  .price-symbol {
    font-size: 24rpx;
    color: #EF4444;
    font-weight: 700;
    margin-right: 4rpx;
  }
  
  .price-value {
    font-size: 36rpx;
    font-weight: 800;
    color: #EF4444;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* 积分抵扣区域 */
.points-toggle-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 16rpx;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.toggle-icon {
  font-size: 48rpx;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.toggle-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.toggle-desc {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 积分详情卡片 */
.points-detail-card {
  background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid #DDD6FE;
}

.points-slider-section {
  margin-bottom: 24rpx;
}

.slider-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16rpx;
}

.slider-wrapper {
  margin-bottom: 16rpx;
}

.points-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  
  .points-num {
    font-size: 48rpx;
    font-weight: 800;
    color: #6366F1;
    font-family: 'DIN Alternate', sans-serif;
  }
  
  .points-unit {
    font-size: 24rpx;
    color: #6B7280;
    margin-left: 8rpx;
  }
}

.discount-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.discount-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #1F2937;
}

.discount-value {
  font-size: 32rpx;
  font-weight: 800;
  color: #10B981;
  font-family: 'DIN Alternate', sans-serif;
}

.points-tips {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tip-text {
  font-size: 22rpx;
  color: #6B7280;
  line-height: 1.5;
}

/* 金额明细 */
.amount-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  
  &.discount-row {
    .amount-label,
    .amount-value {
      color: #10B981;
    }
  }
  
  &.total-row {
    padding-top: 20rpx;
    
    .amount-label {
      font-size: 30rpx;
      font-weight: 700;
    }
  }
}

.amount-label {
  font-size: 28rpx;
  color: #6B7280;
}

.amount-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  font-family: 'DIN Alternate', sans-serif;
  
  &.discount {
    color: #10B981;
  }
}

.amount-divider {
  height: 2rpx;
  background: #F3F4F6;
  margin: 8rpx 0;
}

.total-price {
  display: flex;
  align-items: baseline;
  
  .price-symbol {
    font-size: 28rpx;
    color: #EF4444;
    font-weight: 700;
    margin-right: 4rpx;
  }
  
  .price-value {
    font-size: 40rpx;
    font-weight: 800;
    color: #EF4444;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20rpx);
    border-top: 2rpx solid #F1F5F9;
  }
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.price-label {
  font-size: 24rpx;
  color: #9CA3AF;
}

.price-total {
  display: flex;
  align-items: baseline;
  
  .price-symbol {
    font-size: 24rpx;
    color: #EF4444;
    font-weight: 700;
    margin-right: 4rpx;
  }
  
  .price-value {
    font-size: 40rpx;
    font-weight: 800;
    color: #EF4444;
    font-family: 'DIN Alternate', sans-serif;
  }
}

.submit-btn {
  height: 88rpx;
  padding: 0 64rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 32rpx;
    font-weight: 700;
    color: #FFFFFF;
  }
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
  }
  
  &[loading] {
    opacity: 0.7;
  }
}
</style>
