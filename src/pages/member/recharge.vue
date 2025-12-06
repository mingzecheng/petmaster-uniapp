<template>
  <view class="recharge-container">
    <!-- 金额选择 -->
    <view class="amount-section">
      <text class="section-title">选择充值金额</text>
      <view class="amount-grid">
        <view 
          v-for="amount in presetAmounts" 
          :key="amount"
          :class="['amount-item', { active: selectedAmount === amount }]"
          @click="selectAmount(amount)"
        >
          <text class="amount-value">¥{{ amount }}</text>
        </view>
      </view>
      
      <!-- 自定义金额 -->
      <view class="custom-amount">
        <text class="custom-label">自定义金额</text>
        <view class="custom-input-wrapper">
          <text class="currency">¥</text>
          <input
            type="digit"
            v-model="customAmount"
            placeholder="输入金额"
            class="custom-input"
            @focus="selectedAmount = 0"
          />
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="payment-section">
      <text class="section-title">支付方式</text>
      <view class="payment-item active">
        <text class="payment-icon">💳</text>
        <text class="payment-name">支付宝</text>
        <text class="payment-check">✓</text>
      </view>
    </view>

    <!-- 充值说明 -->
    <view class="tips-section">
      <text class="tips-title">充值说明</text>
      <text class="tips-text">• 充值金额实时到账，余额永久有效</text>
      <text class="tips-text">• 充值成功后可在店内消费使用</text>
      <text class="tips-text">• 如有问题请联系店员</text>
    </view>

    <!-- 确认支付 -->
    <view class="submit-wrapper">
      <view class="total-info">
        <text class="total-label">支付金额</text>
        <text class="total-value">¥{{ finalAmount }}</text>
      </view>
      <button class="submit-btn" :loading="loading" @click="handlePay">
        确认充值
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { createCardRechargePayment } from '@/api/member'

/** 预设金额 */
const presetAmounts = [50, 100, 200, 500, 1000, 2000]

/** 选中金额 */
const selectedAmount = ref(100)

/** 自定义金额 */
const customAmount = ref('')

/** 加载状态 */
const loading = ref(false)

/** 获取页面参数 */
const cardId = ref(0)

// 获取页面参数
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1] as any
if (currentPage?.options?.cardId) {
  cardId.value = parseInt(currentPage.options.cardId)
}

/** 最终金额 */
const finalAmount = computed(() => {
  if (selectedAmount.value > 0) {
    return selectedAmount.value
  }
  return parseFloat(customAmount.value) || 0
})

/**
 * 选择金额
 */
const selectAmount = (amount: number) => {
  selectedAmount.value = amount
  customAmount.value = ''
}

/**
 * 确认支付
 */
const handlePay = async () => {
  if (finalAmount.value <= 0) {
    uni.showToast({ title: '请选择或输入充值金额', icon: 'none' })
    return
  }

  if (finalAmount.value < 10) {
    uni.showToast({ title: '最低充值10元', icon: 'none' })
    return
  }

  if (!cardId.value) {
    uni.showToast({ title: '会员卡信息错误', icon: 'none' })
    return
  }

  loading.value = true
  try {
    uni.showLoading({ title: '创建订单...' })
    
    const res = await createCardRechargePayment(cardId.value, finalAmount.value)
    
    uni.hideLoading()

    if (res.pay_url) {
      uni.showModal({
        title: '支付提示',
        content: '即将跳转至支付宝支付',
        success: (result) => {
          if (result.confirm) {
            // H5环境跳转支付
            // #ifdef H5
            window.open(res.pay_url, '_blank')
            // #endif
            
            // 提示用户支付完成后返回
            setTimeout(() => {
              uni.showModal({
                title: '支付确认',
                content: '请确认是否已完成支付？',
                confirmText: '已完成',
                cancelText: '未支付',
                success: (r) => {
                  if (r.confirm) {
                    uni.showToast({ title: '充值成功', icon: 'success' })
                    setTimeout(() => {
                      uni.navigateBack()
                    }, 1000)
                  }
                }
              })
            }, 2000)
          }
        }
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('创建支付失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.recharge-container {
  min-height: 100vh;
  background: #FFFDE7;
  padding: 30rpx;
  padding-bottom: 200rpx;
}

/* 金额选择 */
.amount-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
  margin-bottom: 24rpx;
}

.amount-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.amount-item {
  width: calc(33.33% - 14rpx);
  height: 120rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.active {
    background: linear-gradient(135deg, #FFF9C4, #FFE57F);
    border-color: #FFD600;
  }
}

.amount-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #212121;
}

.custom-amount {
  border-top: 1rpx solid #F5F5F5;
  padding-top: 24rpx;
}

.custom-label {
  display: block;
  font-size: 28rpx;
  color: #757575;
  margin-bottom: 16rpx;
}

.custom-input-wrapper {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.currency {
  font-size: 36rpx;
  font-weight: 700;
  color: #212121;
  margin-right: 12rpx;
}

.custom-input {
  flex: 1;
  height: 88rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: #212121;
}

/* 支付方式 */
.payment-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  
  &.active {
    .payment-check {
      color: #00C853;
    }
  }
}

.payment-icon {
  font-size: 44rpx;
  margin-right: 20rpx;
}

.payment-name {
  flex: 1;
  font-size: 30rpx;
  color: #212121;
}

.payment-check {
  font-size: 36rpx;
  color: #BDBDBD;
}

/* 充值说明 */
.tips-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #212121;
  margin-bottom: 16rpx;
}

.tips-text {
  display: block;
  font-size: 24rpx;
  color: #757575;
  line-height: 2;
}

/* 确认支付 */
.submit-wrapper {
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
}

.total-info {
  margin-right: 30rpx;
}

.total-label {
  display: block;
  font-size: 24rpx;
  color: #757575;
}

.total-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF6D00;
}

.submit-btn {
  flex: 1;
  height: 96rpx;
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  border: none;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
}
</style>
