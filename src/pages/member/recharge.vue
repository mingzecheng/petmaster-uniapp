<template>
  <view class="recharge-container">
    <!-- 顶部背景装饰 -->
    <view class="header-bg"></view>

    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 金额选择卡片 -->
      <view class="card-section">
        <text class="section-title">充值金额</text>
        <view class="amount-grid">
          <view 
            v-for="amount in presetAmounts" 
            :key="amount"
            :class="['amount-item', { active: selectedAmount === amount }]"
            @click="selectAmount(amount)"
          >
            <view class="amount-content">
              <text class="currency-symbol">¥</text>
              <text class="amount-value">{{ amount }}</text>
            </view>
            <view class="check-mark" v-if="selectedAmount === amount">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
        
        <!-- 自定义金额 -->
        <view :class="['custom-amount-box', { active: selectedAmount === 0 }]">
          <view class="input-row">
            <text class="currency">¥</text>
            <input
              type="digit"
              v-model="customAmount"
              placeholder="请输入自定义金额"
              placeholder-class="input-placeholder"
              class="custom-input"
              @focus="selectedAmount = 0"
            />
          </view>
        </view>
      </view>

      <!-- 支付方式卡片 -->
      <view class="card-section">
        <text class="section-title">支付方式</text>
        <view class="payment-item active">
          <view class="payment-left">
            <image class="payment-icon" src="/static/icon/alipay.png" mode="aspectFit" v-if="false"></image>
            <view class="icon-wrapper alipay">
              <text class="icon-emoji">🔷</text>
            </view>
            <text class="payment-name">支付宝支付</text>
          </view>
          <view class="radio-check">
            <view class="radio-inner"></view>
          </view>
        </view>
      </view>

      <!-- 充值说明 -->
      <view class="tips-section">
        <text class="tips-title">温馨提示</text>
        <view class="tips-list">
          <text class="tips-item">1. 充值余额永久有效，无使用期限。</text>
          <text class="tips-item">2. 余额可用于店内洗护、商品购买等消费。</text>
          <text class="tips-item">3. 充值成功后无法退款，请确认金额后支付。</text>
        </view>
      </view>
    </view>

    <!-- 底部悬浮栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-label">实付金额</text>
        <view class="price-value-row">
          <text class="price-symbol">¥</text>
          <text class="price-num">{{ finalAmount || '0.00' }}</text>
        </view>
      </view>
      <button 
        class="submit-btn" 
        :class="{ disabled: finalAmount <= 0 }"
        :loading="loading" 
        @click="handlePay"
      >
        立即充值
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 会员卡充值页面
 * 支持预设金额和自定义金额，通过支付宝完成充值
 */

import { ref, computed, onMounted } from 'vue'
import { createCardRechargePayment, queryRechargePaymentStatus } from '@/api/member'

/** 预设金额 */
const presetAmounts = [50, 100, 200, 500, 1000, 2000]

/** 选中金额 */
const selectedAmount = ref(100)

/** 自定义金额 */
const customAmount = ref('')

/** 加载状态 */
const loading = ref(false)

/** 会员卡ID */
const cardId = ref(0)

/** 当前订单号（用于轮询） */
const currentOutTradeNo = ref('')

/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null

/**
 * 初始化
 */
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.cardId) {
    cardId.value = parseInt(currentPage.options.cardId)
  }
})

/**
 * 最终金额
 */
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
    
    // 创建充值支付
    const res = await createCardRechargePayment(cardId.value, finalAmount.value)
    uni.hideLoading()

    // 优先使用二维码支付
    if (res.qr_code) {
      currentOutTradeNo.value = res.out_trade_no
      
      // 跳转到支付中间页（二维码模式）
      const qrCode = encodeURIComponent(res.qr_code)
      const returnUrl = encodeURIComponent(`/pages/member/index`)
      
      uni.navigateTo({
        url: `/pages/payment/pay?qrCode=${qrCode}&outTradeNo=${res.out_trade_no}&amount=${finalAmount.value}&returnUrl=${returnUrl}`,
        fail: () => {
          uni.showToast({ title: '跳转失败，请重试', icon: 'none' })
        }
      })
    } else if (res.pay_url) {
      // 检查是否为Mock支付
      if (res.pay_url.includes('/pages/payment/mock')) {
        // Mock支付:提取out_trade_no并直接跳转到mock页面
        try {
          const url = new URL(res.pay_url)
          const outTradeNo = url.searchParams.get('out_trade_no') || res.out_trade_no
          
          currentOutTradeNo.value = outTradeNo
          uni.navigateTo({
            url: `/pages/payment/mock?out_trade_no=${outTradeNo}`,
            fail: (err) => {
              console.error('跳转mock支付页面失败:', err)
              uni.showToast({ title: '页面跳转失败', icon: 'none' })
            }
          })
        } catch (error) {
          // 如果URL解析失败,使用out_trade_no兜底
          currentOutTradeNo.value = res.out_trade_no
          uni.navigateTo({
            url: `/pages/payment/mock?out_trade_no=${res.out_trade_no}`
          })
        }
      } else {
        // 真实支付:备选使用页面支付
        currentOutTradeNo.value = res.out_trade_no
        
        const payUrl = encodeURIComponent(res.pay_url)
        const returnUrl = encodeURIComponent(`/pages/member/index`)
        
        uni.navigateTo({
          url: `/pages/payment/pay?payUrl=${payUrl}&outTradeNo=${res.out_trade_no}&amount=${finalAmount.value}&returnUrl=${returnUrl}`,
          fail: () => {
            handlePayFallback(res.pay_url)
          }
        })
      }
    } else {
      uni.showToast({ title: res.message || '创建支付失败', icon: 'none' })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('创建支付失败:', error)
    uni.showToast({ title: '创建支付失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 备用支付方案（直接打开链接）
 */
const handlePayFallback = (payUrl: string) => {
  // #ifdef H5
  window.open(payUrl, '_blank')
  startPolling()
  uni.showModal({
    title: '支付提示',
    content: '请在新窗口完成支付，支付完成后点击"已完成"',
    confirmText: '已完成',
    cancelText: '取消',
    success: async (result) => {
      stopPolling()
      if (result.confirm) {
        await checkPaymentResult()
      }
    }
  })
  // #endif
  
  // #ifdef MP
  uni.showModal({
    title: '支付提示',
    content: '请复制链接到浏览器中完成支付',
    showCancel: false
  })
  // #endif
}

/**
 * 开始轮询支付状态
 */
const startPolling = () => {
  if (pollTimer) return
  
  pollTimer = setInterval(async () => {
    try {
      const res = await queryRechargePaymentStatus(cardId.value, currentOutTradeNo.value)
      if (res.status === 'paid') {
        stopPolling()
        uni.showToast({ title: '充值成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('轮询状态失败:', error)
    }
  }, 3000)
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

/**
 * 检查支付结果
 */
const checkPaymentResult = async () => {
  uni.showLoading({ title: '查询支付结果...' })
  try {
    const res = await queryRechargePaymentStatus(cardId.value, currentOutTradeNo.value)
    uni.hideLoading()
    
    if (res.status === 'paid') {
      uni.showToast({ title: '充值成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showModal({
        title: '支付未完成',
        content: '未检测到支付成功，请确认是否已完成支付',
        confirmText: '重新检查',
        cancelText: '返回',
        success: (result) => {
          if (result.confirm) {
            checkPaymentResult()
          }
        }
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '查询失败', icon: 'none' })
  }
}
</script>

<style lang="scss">
page {
  background-color: #F9FAFB;
}

.recharge-container {
  min-height: 100vh;
  padding-bottom: 200rpx;
  position: relative;
}

.header-bg {
  height: 240rpx;
  background: linear-gradient(180deg, #FFF8E1 0%, #F9FAFB 100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  padding: 24rpx 32rpx;
}

.card-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 32rpx;
}

.amount-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.amount-item {
  width: calc(33.33% - 14rpx);
  height: 130rpx;
  background: #FFFFFF;
  border: 2rpx solid #E5E7EB;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  
  .currency-symbol {
    font-size: 24rpx;
    color: #9CA3AF;
    margin-bottom: 4rpx;
  }
  
  .amount-value {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
    font-family: DINAlternate-Bold, sans-serif;
  }
  
  .amount-content {
      display: flex;
      flex-direction: column;
      align-items: center;
  }

  &.active {
    background: #FFFBEB;
    border-color: #FFBF00;
    box-shadow: 0 8rpx 20rpx rgba(255, 191, 0, 0.1);
    
    .currency-symbol {
      color: #D97706;
    }
    
    .amount-value {
      color: #B45309;
    }
  }
  
  .check-mark {
    position: absolute;
    right: -2rpx;
    bottom: -2rpx;
    background: #FFBF00;
    width: 36rpx;
    height: 28rpx;
    border-top-left-radius: 16rpx;
    border-bottom-right-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .check-icon {
    font-size: 16rpx;
    color: #FFFFFF;
    font-weight: bold;
    line-height: 1;
  }
}

.custom-amount-box {
  background: #F9FAFB;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  padding: 24rpx 32rpx;
  transition: all 0.3s;
  
  &.active {
    background: #FFFFFF;
    border-color: #FFBF00;
    box-shadow: 0 8rpx 20rpx rgba(255, 191, 0, 0.1);
  }
}

.input-row {
  display: flex;
  align-items: center;
  height: 60rpx;
  
  .currency {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
    margin-right: 16rpx;
  }
  
  .custom-input {
    flex: 1;
    height: 100%;
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2937;
  }
  
  .input-placeholder {
    font-size: 28rpx;
    color: #9CA3AF;
    font-weight: normal;
  }
}

.payment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  
  .payment-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }
  
  .icon-wrapper {
      width: 72rpx;
      height: 72rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.alipay {
          background: #E0F2FE;
          color: #0284C7;
      }
  }
  
  .icon-emoji {
      font-size: 32rpx;
      color: #0284C7;
  }
  
  .payment-name {
    font-size: 30rpx;
    color: #1F2937;
    font-weight: 500;
  }
}

.radio-check {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #FFBF00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx;
  
  .radio-inner {
    width: 100%;
    height: 100%;
    background: #FFBF00;
    border-radius: 50%;
  }
}

.tips-section {
  padding: 24rpx 12rpx;
}

.tips-title {
  display: block;
  font-size: 26rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #9CA3AF;
  line-height: 1.5;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-info {
  .price-label {
    font-size: 24rpx;
    color: #6B7280;
    margin-right: 12rpx;
  }
  
  .price-value-row {
    display: inline-flex;
    align-items: baseline;
    
    .price-symbol {
      font-size: 32rpx;
      color: #FF8F00;
      font-weight: 700;
      margin-right: 4rpx;
    }
    
    .price-num {
      font-size: 52rpx;
      color: #FF8F00;
      font-weight: 700;
      font-family: DINAlternate-Bold, sans-serif;
    }
  }
}

.submit-btn {
  width: 280rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  box-shadow: 0 8rpx 20rpx rgba(255, 143, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &::after {
    border: none;
  }
  
  &:active {
    transform: scale(0.96);
    box-shadow: 0 4rpx 10rpx rgba(255, 143, 0, 0.15);
  }
  
  &.disabled {
    background: #E5E7EB;
    color: #9CA3AF;
    box-shadow: none;
  }
}
</style>
