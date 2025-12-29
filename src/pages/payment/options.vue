<template>
  <view class="payment-options-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <text class="nav-title">支付方式</text>
      <view class="nav-placeholder"></view>
    </view>

    <view class="content">
      <!-- 订单信息 -->
      <view class="order-card glass-card">
        <view class="order-header">
          <text class="order-icon">💰</text>
          <text class="order-title">订单金额</text>
        </view>
        <view class="order-amount">
          <text class="currency">¥</text>
          <text class="amount">{{ orderAmount.toFixed(2) }}</text>
        </view>
        <text class="order-desc">{{ orderSubject }}</text>
      </view>

      <!-- 积分抵扣 -->
      <view class="payment-section glass-card">
        <view class="section-header">
          <view class="header-left">
            <text class="section-icon">⭐</text>
            <text class="section-title">积分抵扣</text>
          </view>
          <switch 
            :checked="usePoints" 
            @change="togglePoints"
            color="#FF6B6B"
          />
        </view>
        
        <view v-if="usePoints" class="section-content">
          <view class="points-info">
            <text class="info-label">可用积分</text>
            <text class="info-value">{{ userPoints }} 分</text>
          </view>
          <view class="points-info">
            <text class="info-label">最多可抵</text>
            <text class="info-value highlight">¥{{ maxPointsDeduction.toFixed(2) }}</text>
          </view>
          
          <!-- 积分滑块 -->
          <view class="points-slider-wrapper">
            <text class="slider-label">使用积分</text>
            <view class="slider-container">
              <slider 
                :value="pointsInput"
                :min="0"
                :max="maxUsablePoints"
                :step="100"
                @change="handleSliderChange"
                activeColor="#FF6B6B"
                backgroundColor="#E5E7EB"
                block-size="20"
              />
            </view>
            <view class="points-value-display">
              <text class="points-num">{{ pointsInput }}</text>
              <text class="points-unit">积分</text>
            </view>
            <text 
              class="use-max-btn" 
              @click="useMaxPoints"
            >
              使用最大
            </text>
          </view>
          
          <view class="deduction-preview">
            <text class="preview-label">抵扣金额</text>
            <text class="preview-value">- ¥{{ pointsDeduction.toFixed(2) }}</text>
          </view>
          
          <view class="points-tips">
            <text class="tip-text">• 100积分起用，100的倍数</text>
            <text class="tip-text">• 最多抵扣订单金额的50%</text>
          </view>
        </view>
      </view>

      <!-- 会员卡余额 -->
      <view class="payment-section glass-card">
        <view class="section-header">
          <view class="header-left">
            <text class="section-icon">💳</text>
            <text class="section-title">会员卡余额</text>
          </view>
          <switch 
            :checked="useCardBalance" 
            @change="toggleCardBalance"
            color="#4ECDC4"
          />
        </view>
        
        <view v-if="useCardBalance" class="section-content">
          <view class="card-info">
            <text class="info-label">当前余额</text>
            <text class="info-value">¥{{ cardBalance.toFixed(2) }}</text>
          </view>
          
          <view class="deduction-preview">
            <text class="preview-label">抵扣金额</text>
            <text class="preview-value">- ¥{{ cardDeduction.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 支付汇总 -->
      <view class="summary-card glass-card">
        <view class="summary-row">
          <text class="summary-label">订单金额</text>
          <text class="summary-value">¥{{ orderAmount.toFixed(2) }}</text>
        </view>
        
        <view v-if="pointsDeduction > 0" class="summary-row discount">
          <text class="summary-label">积分抵扣</text>
          <text class="summary-value">- ¥{{ pointsDeduction.toFixed(2) }}</text>
        </view>
        
        <view v-if="cardDeduction > 0" class="summary-row discount">
          <text class="summary-label">余额抵扣</text>
          <text class="summary-value">- ¥{{ cardDeduction.toFixed(2) }}</text>
        </view>
        
        <view class="summary-divider"></view>
        
        <view class="summary-row total">
          <text class="summary-label">实付金额</text>
          <view class="total-amount">
            <text class="currency">¥</text>
            <text class="amount">{{ finalAmount.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部支付按钮 -->
    <view class="bottom-bar glass">
      <view class="bottom-info">
        <text class="info-text">实付</text>
        <view class="amount-display">
          <text class="currency">¥</text>
          <text class="amount">{{ finalAmount.toFixed(2) }}</text>
        </view>
      </view>
      <button 
        class="pay-button" 
        :disabled="loading"
        :loading="loading"
        @click="handlePay"
      >
        {{ finalAmount === 0 ? '确认支付' : '立即支付' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createCombinedPayment } from '@/api/payment'
import { getMyMemberCard } from '@/api/member'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 订单信息（从路由参数获取）
const orderAmount = ref(0)
const orderSubject = ref('')
const relatedId = ref(0)
const relatedType = ref<'appointment' | 'boarding'>('appointment')

// 用户资产
const userPoints = ref(0)
const cardBalance = ref(0)

// 支付选项
const usePoints = ref(false)
const useCardBalance = ref(true)
const pointsInput = ref(0)
const loading = ref(false)

/**
 * 最大积分抵扣金额（订单金额的50%）
 */
const maxPointsDeduction = computed(() => {
  return orderAmount.value * 0.5
})

/**
 * 最大可用积分
 */
const maxUsablePoints = computed(() => {
  const maxByAmount = Math.floor(maxPointsDeduction.value * 100)
  return Math.min(userPoints.value, maxByAmount)
})

/**
 * 积分抵扣金额
 */
const pointsDeduction = computed(() => {
  if (!usePoints.value || pointsInput.value <=0) return 0
  return Math.min(pointsInput.value / 100, maxPointsDeduction.value, orderAmount.value)
})

/**
 * 会员卡抵扣金额（积分抵扣后的剩余金额）
 */
const cardDeduction = computed(() => {
  if (!useCardBalance.value) return 0
  const remaining = orderAmount.value - pointsDeduction.value
  return Math.min(cardBalance.value, remaining)
})

/**
 * 最终需支付金额
 */
const finalAmount = computed(() => {
  const remaining = orderAmount.value - pointsDeduction.value - cardDeduction.value
  return Math.max(0, remaining)
})

/**
 * 切换积分使用
 */
const togglePoints = (e: any) => {
  usePoints.value = e.detail.value
  if (!usePoints.value) {
    pointsInput.value = 0
  }
}

/**
 * 切换会员卡使用
 */
const toggleCardBalance = (e: any) => {
  useCardBalance.value = e.detail.value
}

/**
 * 积分滑块变化处理
 */
const handleSliderChange = (e: any) => {
  const value = e.detail.value
  // 确保是100的倍数
  pointsInput.value = Math.floor(value / 100) * 100
}

/**
 * 使用最大积分
 */
const useMaxPoints = () => {
  pointsInput.value = maxUsablePoints.value
}

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 确认支付
 */
const handlePay = async () => {
  loading.value = true
  try {
    const result = await createCombinedPayment({
      amount: orderAmount.value,
      subject: orderSubject.value,
      related_id: relatedId.value,
      related_type: relatedType.value,
      use_card_balance: useCardBalance.value,
      use_points: usePoints.value ? pointsInput.value : 0
    })

    // 根据支付结果跳转
    if (result.fully_paid) {
      // 全额抵扣
      uni.showToast({
        title: '支付成功！',
        icon: 'success',
        duration: 2000
      })
      setTimeout(() => {
        uni.navigateBack({ delta: 2 })
      }, 2000)
    } else {
      // 需要支付宝
      if (result.points_deduction > 0 || result.card_used > 0) {
        const parts: string[] = []
        if (result.points_deduction > 0) {
          parts.push(`积分抵扣¥${result.points_deduction.toFixed(2)}`)
        }
        if (result.card_used > 0) {
          parts.push(`余额抵扣¥${result.card_used.toFixed(2)}`)
        }
        uni.showToast({
          title: parts.join('，'),
          icon: 'none',
          duration: 2000
        })
      }
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/payment/mock?out_trade_no=${result.out_trade_no}`
        })
      }, 2000)
    }
  } catch (error) {
    console.error('支付失败:', error)
    uni.showToast({
      title: error instanceof Error ? error.message : '支付失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 页面加载
 */
onMounted(async () => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || currentPage.$page?.options || {}
  
  orderAmount.value = parseFloat(options.amount || '0')
  orderSubject.value = decodeURIComponent(options.subject || '')
  relatedId.value = parseInt(options.related_id || '0')
  relatedType.value = (options.related_type || 'appointment') as 'appointment' | 'boarding'

  // 获取用户积分
  if (userStore.userInfo) {
    userPoints.value = userStore.userInfo.points || 0
    
    // 获取会员卡余额（需要传递userId）
    try {
      const card = await getMyMemberCard(userStore.userInfo.id)
      if (card && card.balance) {
        cardBalance.value = parseFloat(card.balance.toString())
      }
    } catch (error) {
      console.log('获取会员卡失败:', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.payment-options-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  padding: 20rpx 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.nav-back {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  transition: all 0.3s;
  
  .icon {
    font-size: 40rpx;
    color: #667eea;
  }
  
  &:active {
    transform: scale(0.95);
    background: rgba(102, 126, 234, 0.2);
  }
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #2d3748;
}

.nav-placeholder {
  width: 72rpx;
}

/* 内容区域 */
.content {
  padding-top: calc(var(--status-bar-height, 44px) + 112rpx);
  padding: calc(var(--status-bar-height, 44px) + 132rpx) 32rpx 0;
}

/* 玻璃卡片效果 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 24rpx;
  overflow: hidden;
}

/* 订单卡片 */
.order-card {
  padding: 48rpx 32rpx;
  text-align: center;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.order-icon {
  font-size: 48rpx;
}

.order-title {
  font-size: 32rpx;
  color: #4a5568;
}

.order-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 16rpx;
  
  .currency {
    font-size: 40rpx;
    color: #FF6B6B;
    font-weight: 500;
  }
  
  .amount {
    font-size: 72rpx;
    font-weight: 700;
    color: #FF6B6B;
    margin-left: 8rpx;
  }
}

.order-desc {
  font-size: 28rpx;
  color: #718096;
}

/* 支付选项卡片 */
.payment-section {
  padding: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-icon {
  font-size: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2d3748;
}

.section-content {
  padding-top: 24rpx;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}

/* 积分/余额信息 */
.points-info,
.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}

.info-label {
  font-size: 28rpx;
  color: #718096;
}

.info-value {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3748;
  
  &.highlight {
    color: #FF6B6B;
  }
}

/* 积分滑块 */
.points-slider-wrapper {
  margin: 24rpx 0;
  padding: 24rpx;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 107, 107, 0.02));
  border-radius: 16rpx;
}

.slider-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 16rpx;
}

.slider-container {
  margin-bottom: 16rpx;
}

.points-value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 16rpx;
  
  .points-num {
    font-size: 48rpx;
    font-weight: 800;
    color: #FF6B6B;
    font-family: 'DIN Alternate', sans-serif;
  }
  
  .points-unit {
    font-size: 24rpx;
    color: #a0aec0;
    margin-left: 8rpx;
  }
}

.use-max-btn {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #667eea;
  font-weight: 600;
  padding: 12rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12rpx;
  transition: all 0.3s;
  
  &:active {
    background: rgba(102, 126, 234, 0.2);
  }
}

/* 积分提示 */
.points-tips {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12rpx;
}

.tip-text {
  font-size: 22rpx;
  color: #718096;
  line-height: 1.5;
}

/* 抵扣预览 */
.deduction-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-radius: 16rpx;
  margin-top: 24rpx;
}

.preview-label {
  font-size: 28rpx;
  color: #4a5568;
}

.preview-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #667eea;
}

/* 汇总卡片 */
.summary-card {
  padding: 32rpx;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  
  &.discount {
    .summary-value {
      color: #48bb78;
    }
  }
  
  &.total {
    padding-top: 24rpx;
    
    .summary-label {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
}

.summary-label {
  font-size: 28rpx;
  color: #4a5568;
}

.summary-value {
  font-size: 30rpx;
  font-weight: 500;
  color: #2d3748;
}

.summary-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  margin: 16rpx 0;
}

.total-amount {
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 32rpx;
    color: #FF6B6B;
    font-weight: 500;
  }
  
  .amount {
    font-size: 48rpx;
    font-weight: 700;
    color: #FF6B6B;
    margin-left: 6rpx;
  }
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
}

.bottom-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-text {
  font-size: 24rpx;
  color: #a0aec0;
}

.amount-display {
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 28rpx;
    color: #FF6B6B;
    font-weight: 500;
  }
  
  .amount {
    font-size: 48rpx;
    font-weight: 700;
    color: #FF6B6B;
    margin-left: 4rpx;
  }
}

.pay-button {
  flex-shrink: 0;
  width: 360rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  }
  
  &[disabled] {
    opacity: 0.6;
  }
}

.glass {
  backdrop-filter: blur(12px);
}
</style>
