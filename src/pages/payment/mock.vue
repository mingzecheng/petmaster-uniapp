<template>
  <view class="mock-payment-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">模拟支付</text>
      <view class="placeholder-btn"></view>
    </view>

    <!-- 支付信息 -->
    <view class="content-wrapper">
      <view class="payment-card">
        <view class="mock-badge">
          <text>🧪 开发测试模式</text>
        </view>

        <view class="payment-info">
          <view class="info-item">
            <text class="label">订单号</text>
            <text class="value">{{ paymentInfo.out_trade_no }}</text>
          </view>
          <view class="info-item">
            <text class="label">支付金额</text>
            <view class="amount">
              <text class="currency">¥</text>
              <text class="number">{{ paymentInfo.amount }}</text>
            </view>
          </view>
          <view class="info-item">
            <text class="label">订单标题</text>
            <text class="value">{{ paymentInfo.subject }}</text>
          </view>
        </view>

        <view class="actions">
          <button
            class="confirm-btn"
            :loading="loading"
            @click="confirmPayment"
          >
            <text>确认支付</text>
          </button>
          <button class="cancel-btn" @click="cancelPayment">
            <text>取消</text>
          </button>
        </view>

        <view class="tips">
          <text class="tip-icon">💡</text>
          <text class="tip-text">这是模拟支付页面，仅用于开发测试</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description Mock支付页面（开发测试用）
 */

import { ref, onMounted } from 'vue'
import { queryPaymentStatus } from '@/api/payment'
import { post } from '@/utils/request'

/** URL参数 */
const out_trade_no = ref('')

/** 支付信息 */
const paymentInfo = ref({
  out_trade_no: '',
  amount: '0.00',
  subject: '未知订单'
})

/** 加载状态 */
const loading = ref(false)

/**
 * 初始化
 */
onMounted(() => {
  // 获取URL参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  out_trade_no.value = currentPage.options.out_trade_no || ''
  
  if (!out_trade_no.value) {
    uni.showToast({ title: '缺少订单号', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }
  
  paymentInfo.value.out_trade_no = out_trade_no.value
  
  // 查询支付信息
  queryPaymentInfo()
})

/**
 * 查询支付信息
 */
const queryPaymentInfo = async () => {
  try {
    const response = await queryPaymentStatus(out_trade_no.value)
    // 更新支付信息
    if (response) {
      paymentInfo.value.amount = response.amount
      paymentInfo.value.out_trade_no = response.out_trade_no
      paymentInfo.value.subject = response.subject || '未知订单'
    }
  } catch (error) {
    console.error('查询支付信息失败:', error)
    uni.showToast({ title: '查询支付信息失败', icon: 'none' })
  }
}

/**
 * 确认支付
 */
const confirmPayment = async () => {
  loading.value = true
  try {
    await post('/mock-payment/confirm', {
      out_trade_no: out_trade_no.value
    })
    
    uni.showToast({ title: '支付成功', icon: 'success' })
    
    // 延迟跳转到首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (error: any) {
    console.error('确认支付失败:', error)
    uni.showToast({
      title: error.message || '支付失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

/**
 * 取消支付
 */
const cancelPayment = () => {
  uni.showModal({
    title: '取消支付',
    content: '确定要取消支付吗？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack()
      }
    }
  })
}

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss">
page {
  background-color: #F1F5F9;
}

.mock-payment-container {
  min-height: 100vh;
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
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
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
    line-height: 1;
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

/* 内容区域 */
.content-wrapper {
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
  padding: calc(var(--status-bar-height, 44px) + 120rpx) 24rpx 40rpx;
}

.payment-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.mock-badge {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
  
  text {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    color: #FFFFFF;
    padding: 12rpx 24rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
    font-weight: 600;
  }
}

.payment-info {
  margin-bottom: 48rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F1F5F9;
  
  &:last-child {
    border-bottom: none;
  }
}

.label {
  font-size: 28rpx;
  color: #64748B;
}

.value {
  font-size: 28rpx;
  color: #1E293B;
  font-weight: 500;
}

.amount {
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 28rpx;
    font-weight: 600;
    color: #F97316;
    margin-right: 4rpx;
  }
  
  .number {
    font-size: 48rpx;
    font-weight: 700;
    color: #F97316;
    font-family: 'DIN Alternate', sans-serif;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.confirm-btn {
  height: 88rpx;
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 32rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
  
  &::after { border: none; }
}

.cancel-btn {
  height: 88rpx;
  background: #F1F5F9;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 32rpx;
    font-weight: 600;
    color: #64748B;
  }
  
  &::after { border: none; }
}

.tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  background: #FFF7ED;
  border-radius: 16rpx;
}

.tip-icon {
  font-size: 28rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #F97316;
}
</style>
