<template>
  <view class="order-detail-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">订单详情</text>
      <view class="placeholder-btn"></view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-wrapper">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 订单内容 -->
    <view v-else-if="order" class="content-wrapper">
      <!-- 状态卡片 -->
      <view class="status-card">
        <view :class="['status-icon-wrapper', getStatusClass(order.status)]">
          <text class="status-icon">{{ getStatusIcon(order.status) }}</text>
        </view>
        <text class="status-text">{{ getStatusText(order.status) }}</text>
      </view>

      <!-- 订单信息卡片 -->
      <view class="info-card">
        <view class="card-title">
          <text>订单信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">订单号</text>
            <text class="value">{{ order.order_no }}</text>
          </view>
          <view class="info-item">
            <text class="label">下单时间</text>
            <text class="value">{{ formatDate(order.created_at) }}</text>
          </view>
          <view class="info-item" v-if="order.paid_at">
            <text class="label">支付时间</text>
            <text class="value">{{ formatDate(order.paid_at) }}</text>
          </view>
          <view class="info-item" v-if="order.completed_at">
            <text class="label">完成时间</text>
            <text class="value">{{ formatDate(order.completed_at) }}</text>
          </view>
        </view>
      </view>

      <!-- 商品明细卡片 -->
      <view class="items-card">
        <view class="card-title">
          <text>商品明细</text>
        </view>
        <view class="items-list">
          <view v-for="item in order.items" :key="item.id" class="item-row">
            <view class="item-info">
              <text class="item-name">{{ item.product_name }}</text>
              <text class="item-price">¥{{ item.product_price }}</text>
            </view>
            <view class="item-quantity">
              <text>x{{ item.quantity }}</text>
            </view>
            <view class="item-subtotal">
              <text>¥{{ item.subtotal }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 金额汇总卡片 -->
      <view class="summary-card">
        <view class="summary-row" v-if="order.original_amount">
          <text class="summary-label">商品原价</text>
          <view class="summary-value">
            <text class="currency">¥</text>
            <text class="amount">{{ order.original_amount }}</text>
          </view>
        </view>
        <view class="summary-row discount" v-if="order.member_discount && order.member_discount > 0">
          <text class="summary-label">会员折扣</text>
          <view class="summary-value">
            <text class="currency discount">-¥</text>
            <text class="amount discount">{{ order.member_discount }}</text>
          </view>
        </view>
        <view class="summary-row discount" v-if="order.points_used && order.points_used > 0">
          <text class="summary-label">积分抵扣 ({{ order.points_used }}分)</text>
          <view class="summary-value">
            <text class="currency discount">-¥</text>
            <text class="amount discount">{{ order.points_discount || (order.points_used / 100).toFixed(2) }}</text>
          </view>
        </view>
        <view class="summary-row total">
          <text class="summary-label">{{ order.status === 'paid' ? '实付金额' : '应付金额' }}</text>
          <view class="summary-value">
            <text class="currency primary">¥</text>
            <text class="amount primary">{{ getPaymentAmount() }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-wrapper">
      <text class="error-icon">❌</text>
      <text class="error-text">订单不存在</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 订单详情页面
 */

import { ref, onMounted } from 'vue'
import { getOrderDetail, type OrderWithItems } from '@/api/order'

/** 订单详情 */
const order = ref<OrderWithItems | null>(null)

/** 加载状态 */
const loading = ref(true)

/**
 * 初始化
 */
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    loadOrder(parseInt(currentPage.options.id))
  }
})

/**
 * 加载订单详情
 */
const loadOrder = async (orderId: number) => {
  loading.value = true
  try {
    const data = await getOrderDetail(orderId)
    order.value = data
  } catch (error) {
    console.error('加载订单详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    pending: 'status-pending',
    paid: 'status-paid',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    refunded: 'status-refunded'
  }
  return classMap[status] || 'status-default'
}

/**
 * 获取状态图标
 */
const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    pending: '⏳',
    paid: '✅',
    completed: '🎉',
    cancelled: '❌',
    refunded: '↩️'
  }
  return iconMap[status] || '📦'
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return textMap[status] || status
}

/**
 * 获取支付金额
 * - 已支付订单：使用 paid_amount（实付金额，扣除所有折扣）
 * - 待支付订单：使用 total_amount（应付金额）
 */
const getPaymentAmount = (): string => {
  if (!order.value) return '0.00'
  
  // 已支付订单：使用 paid_amount（真正的实付金额）
  if (order.value.status === 'paid' || order.value.status === 'completed') {
    if (order.value.paid_amount !== null && order.value.paid_amount !== undefined) {
      const amount = typeof order.value.paid_amount === 'string' 
        ? parseFloat(order.value.paid_amount) 
        : order.value.paid_amount
      return amount.toFixed(2)
    }
  }
  
  // 待支付订单：使用 total_amount（应付总额）
  const total = typeof order.value.total_amount === 'string' 
    ? parseFloat(order.value.total_amount) 
    : order.value.total_amount
  return total.toFixed(2)
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style lang="scss">
page {
  background-color: #F1F5F9;
}

.order-detail-container {
  min-height: 100vh;
  padding-bottom: 40rpx;
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
  padding-top: calc(var(--status-bar-height, 44px) + 140rpx);
  padding-left: 24rpx;
  padding-right: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 加载和错误状态 */
.loading-wrapper,
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.loading-text,
.error-text {
  font-size: 28rpx;
  color: #64748B;
}

.error-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

/* 状态卡片 */
.status-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.status-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.status-pending {
    background: #FFF7ED;
  }
  
  &.status-paid {
    background: #ECFDF5;
  }
  
  &.status-completed {
    background: #EFF6FF;
  }
  
  &.status-cancelled {
    background: #F3F4F6;
  }
  
  &.status-refunded {
    background: #FEF2F2;
  }
}

.status-icon {
  font-size: 64rpx;
}

.status-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
}

/* 信息卡片 */
.info-card,
.items-card,
.summary-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 24rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    font-size: 26rpx;
    color: #64748B;
  }
  
  .value {
    font-size: 26rpx;
    color: #1E293B;
    font-family: monospace;
  }
}

/* 商品明细 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #F8FAFC;
  border-radius: 16rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1E293B;
}

.item-price {
  font-size: 24rpx;
  color: #64748B;
}

.item-quantity {
  text {
    font-size: 24rpx;
    color: #64748B;
  }
}

.item-subtotal {
  min-width: 120rpx;
  text-align: right;
  
  text {
    font-size: 28rpx;
    font-weight: 600;
    color: #1E293B;
  }
}

/* 金额汇总 */
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  
  &.total {
    padding-top: 24rpx;
    border-top: 2rpx solid #F1F5F9;
  }
}

.summary-label {
  font-size: 26rpx;
  color: #64748B;
}

.summary-value {
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 24rpx;
    font-weight: 600;
    color: #1E293B;
    margin-right: 4rpx;
    
    &.primary {
      color: #F97316;
    }
    
    &.discount {
      color: #10B981;
    }
  }
  
  .amount {
    font-size: 32rpx;
    font-weight: 700;
    color: #1E293B;
    font-family: 'DIN Alternate', sans-serif;
    
    &.primary {
      font-size: 40rpx;
      color: #F97316;
    }
    
    &.discount {
      color: #10B981;
    }
  }
}
</style>
