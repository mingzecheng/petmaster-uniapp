<template>
  <view class="pay-container">
    <view class="status-card">
      <!-- 加载状态 -->
      <view v-if="loading" class="status-content">
        <view class="loading-spinner"></view>
        <text class="status-text">正在创建支付...</text>
      </view>

      <!-- 二维码支付状态 -->
      <view v-else-if="showQrCode" class="status-content qrcode-mode">
        <text class="status-title">请扫码支付</text>
        <text class="status-desc">请使用支付宝扫描下方二维码</text>

        <view class="amount-display">
          <text class="currency">¥</text>
          <text class="amount">{{ amount }}</text>
        </view>

        <!-- 二维码展示区 -->
        <view class="qrcode-box">
          <!-- 使用 canvas 绘制二维码 -->
          <canvas canvas-id="qrcodeCanvas" class="qrcode-canvas"></canvas>
          <!-- 备用：图片显示 -->
          <image v-if="qrCodeImage" :src="qrCodeImage" class="qrcode-image" mode="aspectFit"></image>
          <!-- 支付宝 Logo -->
          <view class="alipay-tip">
            <text class="alipay-icon">💙</text>
            <text class="alipay-text">支付宝</text>
          </view>
        </view>

        <!-- 等待时间提示 -->
        <view class="wait-time-box">
          <text class="wait-time-label">已等待</text>
          <text class="wait-time-value">{{ formatWaitTime }}</text>
        </view>

        <view class="action-buttons">
          <button class="btn-primary" @click="checkPaymentStatus">
            我已完成支付
          </button>
        </view>

        <view class="tip-box">
          <text class="tip-text">• 打开支付宝APP，扫描上方二维码</text>
          <text class="tip-text">• 支付完成后，点击"我已完成支付"</text>
          <text class="tip-text link" @click="cancelPayment">放弃支付，返回上一页</text>
        </view>
      </view>

      <!-- 页面支付中状态（备选） -->
      <view v-else-if="paying" class="status-content">
        <view class="paying-icon-bg">
          <text class="paying-icon">⏳</text>
        </view>
        <text class="status-title">等待支付完成</text>
        <text class="status-desc">请在新打开的页面完成支付</text>

        <view class="amount-display">
          <text class="currency">¥</text>
          <text class="amount">{{ amount }}</text>
        </view>

        <!-- 等待时间提示 -->
        <view class="wait-time-box">
          <text class="wait-time-label">已等待</text>
          <text class="wait-time-value">{{ formatWaitTime }}</text>
        </view>

        <view class="action-buttons">
          <button class="btn-primary" @click="checkPaymentStatus">
            我已完成支付
          </button>
          <button class="btn-secondary" @click="retryPayment">
            重新打开支付
          </button>
        </view>

        <view class="tip-box">
          <text class="tip-text">• 如果支付页面已关闭，点击"重新打开支付"</text>
          <text class="tip-text">• 如果已完成支付，点击"我已完成支付"</text>
          <text class="tip-text link" @click="cancelPayment">放弃支付，返回上一页</text>
        </view>
      </view>

      <!-- 支付结果 -->
      <view v-else class="status-content">
        <view v-if="paySuccess" class="result-box success">
          <view class="result-icon-bg">
            <text class="result-icon">✓</text>
          </view>
          <text class="status-title">支付成功</text>
          <text class="status-desc">您的充值已实时到账</text>
          <button class="btn-primary full-width" @click="goBack">返回</button>
        </view>
        
        <view v-else class="result-box fail">
          <view class="result-icon-bg fail">
            <text class="result-icon">!</text>
          </view>
          <text class="status-title">支付未完成</text>
          <text class="status-desc">{{ errorMsg }}</text>
          <button class="btn-primary full-width" @click="retryPayment">重新支付</button>
          <button class="btn-secondary full-width" @click="goBack">返回</button>
        </view>
      </view>
    </view>

    <!-- 小程序 webview（仅小程序环境使用） -->
    <!-- #ifdef MP -->
    <web-view v-if="showWebview" :src="payUrl" @message="onWebviewMessage"></web-view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
/**
 * @description 支付中间页
 * 处理不同环境的支付跳转和状态轮询
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { queryPaymentStatus } from '@/api/payment'

/** 页面参数 */
const payUrl = ref('')
const outTradeNo = ref('')
const amount = ref('0')
const returnUrl = ref('')
const qrCode = ref('')  // 二维码链接

/** 状态 */
const loading = ref(true)
const paying = ref(false)
const paySuccess = ref(false)
const showWebview = ref(false)
const showQrCode = ref(false)  // 是否显示二维码
const qrCodeImage = ref('')  // 二维码图片（使用第三方API生成）
const errorMsg = ref('')

/** 等待时间（秒） */
const waitSeconds = ref(0)
let waitTimer: ReturnType<typeof setInterval> | null = null

/** 格式化等待时间 */
const formatWaitTime = computed(() => {
  const mins = Math.floor(waitSeconds.value / 60)
  const secs = waitSeconds.value % 60
  if (mins > 0) {
    return `${mins}分${secs}秒`
  }
  return `${secs}秒`
})

/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null
let pollCount = 0
const MAX_POLL_COUNT = 60  // 最多轮询60次（约3分钟）

/**
 * 初始化页面
 */
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any

  if (currentPage?.options) {
    payUrl.value = decodeURIComponent(currentPage.options.payUrl || '')
    outTradeNo.value = currentPage.options.outTradeNo || ''
    amount.value = currentPage.options.amount || '0'
    returnUrl.value = currentPage.options.returnUrl || ''
    qrCode.value = decodeURIComponent(currentPage.options.qrCode || '')
  }

  // 判断支付模式
  if (qrCode.value) {
    // 二维码支付模式
    loading.value = false
    showQrCode.value = true
    // 使用第三方 API 生成二维码图片
    qrCodeImage.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode.value)}`
    startPolling()
    startWaitTimer()
  } else if (payUrl.value) {
    // 页面支付模式
    openPaymentPage()
  } else {
    errorMsg.value = '支付参数无效'
    loading.value = false
  }
})

/**
 * 清理资源
 */
onUnmounted(() => {
  stopPolling()
  stopWaitTimer()
})

/**
 * 启动等待计时器
 */
const startWaitTimer = () => {
  waitSeconds.value = 0
  waitTimer = setInterval(() => {
    waitSeconds.value++
  }, 1000)
}

/**
 * 停止等待计时器
 */
const stopWaitTimer = () => {
  if (waitTimer) {
    clearInterval(waitTimer)
    waitTimer = null
  }
}

/**
 * 打开支付页面
 */
const openPaymentPage = () => {
  loading.value = false
  paying.value = true
  
  // 启动等待计时器
  startWaitTimer()

  // #ifdef H5
  // H5 环境：新窗口打开支付页面
  window.open(payUrl.value, '_blank')
  // 开始轮询支付状态
  startPolling()
  // #endif

  // #ifdef MP
  // 小程序环境：使用 webview 打开
  showWebview.value = true
  // #endif
}

/**
 * 开始轮询支付状态
 */
const startPolling = () => {
  pollCount = 0
  pollTimer = setInterval(async () => {
    pollCount++

    if (pollCount > MAX_POLL_COUNT) {
      stopPolling()
      return
    }

    try {
      const res = await queryPaymentStatus(outTradeNo.value)
      if (res.status === 'paid' || res.is_paid) {
        stopPolling()
        paying.value = false
        paySuccess.value = true
      }
    } catch (error) {
      console.error('轮询支付状态失败:', error)
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
 * 手动检查支付状态
 */
const checkPaymentStatus = async () => {
  uni.showLoading({ title: '查询中...' })

  try {
    const res = await queryPaymentStatus(outTradeNo.value)
    uni.hideLoading()

    if (res.status === 'paid' || res.is_paid) {
      stopPolling()
      paying.value = false
      paySuccess.value = true
      uni.showToast({ title: '支付成功', icon: 'success' })
    } else {
      uni.showModal({
        title: '支付未完成',
        content: '未检测到支付成功，请确认是否已完成支付',
        confirmText: '继续等待',
        cancelText: '取消支付',
        success: (result) => {
          if (result.cancel) {
            cancelPayment()
          }
        }
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '查询失败', icon: 'none' })
  }
}

/**
 * 取消支付
 */
const cancelPayment = () => {
  stopPolling()
  paying.value = false
  paySuccess.value = false
  errorMsg.value = '您已取消支付'
}

/**
 * 重新支付
 */
const retryPayment = () => {
  loading.value = true
  paying.value = false
  paySuccess.value = false
  openPaymentPage()
}

/**
 * 返回上一页
 */
const goBack = () => {
  if (returnUrl.value) {
    // 使用 reLaunch 确保能跳转到任何页面（包括 tabBar 页面）
    uni.reLaunch({ 
      url: returnUrl.value,
      fail: () => {
        // 如果 reLaunch 失败，尝试 switchTab（tabBar 页面）
        uni.switchTab({
          url: returnUrl.value,
          fail: () => {
            // 最后兜底使用 navigateBack
            uni.navigateBack()
          }
        })
      }
    })
  } else {
    uni.navigateBack()
  }
}

/**
 * webview 消息处理（小程序）
 */
const onWebviewMessage = (e: any) => {
  console.log('webview message:', e)
  // 支付完成后返回时自动检查状态
  checkPaymentStatus()
}
</script>

<style lang="scss">
page {
  background-color: #F7F8FA;
}

.pay-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background-color: $pet-bg-base;
}

.status-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Loading */
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #E0E0E0;
  border-top-color: #FFC107;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-size: 28rpx;
  color: #999;
}

/* Paying */
.paying-icon-bg {
  width: 120rpx;
  height: 120rpx;
  background: #FFF8E1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.paying-icon {
  font-size: 56rpx;
}

.status-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 12rpx;
}

.status-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.amount-display {
  margin-bottom: 60rpx;
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-right: 4rpx;
  }
  
  .amount {
    font-size: 64rpx;
    font-weight: 700;
    color: #333;
    font-family: DINAlternate-Bold, sans-serif;
  }
}

.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FFD54F, #FFB300);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  box-shadow: 0 8rpx 20rpx rgba(255, 179, 0, 0.3);
  border: none;
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 10rpx rgba(255, 179, 0, 0.2);
  }
}

.btn-secondary {
  width: 100%;
  height: 96rpx;
  background: #F5F5F5;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #666;
  border: none;
  
  &::after { border: none; }
  
  &:active {
    background: #E0E0E0;
  }
}

.bottom-tip {
  font-size: 24rpx;
  color: #CCC;
  margin-top: 40rpx;
}

/* Result */
.result-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .result-icon-bg {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    
    &.fail {
      background: #FFEBEE;
      .result-icon { color: #FF5252; }
    }
  }
  
  .result-icon-bg:not(.fail) {
    background: #E8F5E9;
    .result-icon { color: #4CAF50; font-size: 60rpx; }
  }
}

.full-width {
  width: 100%;
  margin-bottom: 24rpx;
}

/* 等待时间 */
.wait-time-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  padding: 16rpx 32rpx;
  background: #FFF8E1;
  border-radius: 24rpx;
}

.wait-time-label {
  font-size: 26rpx;
  color: #757575;
  margin-right: 8rpx;
}

.wait-time-value {
  font-size: 28rpx;
  color: $pet-primary-dark;
  font-weight: 600;
}

/* 提示框 */
.tip-box {
  width: 100%;
  margin-top: 40rpx;
  padding: 24rpx;
  background: #F5F5F5;
  border-radius: 16rpx;
}

.tip-text {
  display: block;
  font-size: 24rpx;
  color: #757575;
  line-height: 1.8;
  
  &.link {
    color: $pet-secondary;
    margin-top: 16rpx;
    text-decoration: underline;
  }
}

/* 二维码样式 */
.qrcode-mode {
  .status-title {
    color: #1677FF;
  }
}

.qrcode-box {
  width: 400rpx;
  height: 400rpx;
  background: #fff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40rpx auto;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 4rpx solid #1677FF;
  position: relative;
}

.qrcode-canvas {
  width: 320rpx;
  height: 320rpx;
}

.qrcode-image {
  width: 320rpx;
  height: 320rpx;
}

.alipay-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
  position: absolute;
  bottom: 16rpx;
}

.alipay-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.alipay-text {
  font-size: 24rpx;
  color: #1677FF;
  font-weight: 600;
}
</style>

