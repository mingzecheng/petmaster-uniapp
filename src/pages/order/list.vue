<template>
  <view class="order-list-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">我的订单</text>
      <view class="placeholder-btn"></view>
    </view>

    <!-- 订单列表 -->
    <view class="content-wrapper">
      <view v-if="loading && orders.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="orders.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
        <button class="go-shop-btn" @click="goToProducts">
          <text>去购物</text>
        </button>
      </view>

      <view v-else class="order-list">
        <view
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          @click="goToDetail(order.id)"
        >
          <view class="order-header">
            <view class="order-no">
              <text class="label">订单号：</text>
              <text class="value">{{ order.order_no }}</text>
            </view>
            <view :class="['status-badge', getStatusClass(order.status)]">
              <text>{{ getStatusText(order.status) }}</text>
            </view>
          </view>

          <view class="order-body">
            <view class="order-meta">
              <view class="meta-item">
                <text class="meta-label">下单时间</text>
                <text class="meta-value">{{ formatDate(order.created_at) }}</text>
              </view>
              <view class="meta-item" v-if="order.paid_at">
                <text class="meta-label">支付时间</text>
                <text class="meta-value">{{ formatDate(order.paid_at) }}</text>
              </view>
            </view>

            <view class="order-amount">
              <text class="amount-label">订单金额</text>
              <view class="amount-value">
                <text class="currency">¥</text>
                <text class="number">{{ order.total_amount }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 订单列表页面
 */

import { ref, onMounted } from 'vue'
import { getMyOrders, type Order } from '@/api/order'

/** 订单列表 */
const orders = ref<Order[]>([])

/** 加载状态 */
const loading = ref(false)

/**
 * 初始化
 */
onMounted(() => {
  loadOrders()
})

/**
 * 加载订单列表
 */
const loadOrders = async () => {
  loading.value = true
  try {
    const data = await getMyOrders({ skip: 0, limit: 100 })
    orders.value = data
  } catch (error) {
    console.error('加载订单失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 返回
 */
const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    // 导航栈有多个页面,可以正常返回
    uni.navigateBack()
  } else {
    // 导航栈只有一个页面,返回到"我的"页面
    uni.switchTab({ url: '/pages/mine/index' })
  }
}

/**
 * 去购物
 */
const goToProducts = () => {
  // 商品列表是TabBar页面，需要使用switchTab
  uni.switchTab({ url: '/pages/product/list' })
}

/**
 * 查看订单详情
 */
const goToDetail = (orderId: number) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${orderId}` })
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

.order-list-container {
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
}

/* 加载状态 */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #64748B;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.8;
}

.empty-text {
  font-size: 28rpx;
  color: #64748B;
  margin-bottom: 40rpx;
}

.go-shop-btn {
  width: 200rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 28rpx;
    font-weight: 600;
    color: #1F2937;
  }
  
  &::after { border: none; }
}

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #F1F5F9;
}

.order-no {
  flex: 1;
  
  .label {
    font-size: 24rpx;
    color: #64748B;
  }
  
  .value {
    font-size: 24rpx;
    color: #1E293B;
    font-family: monospace;
    margin-left: 8rpx;
  }
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 600;
  
  &.status-pending {
    background: #FFF7ED;
    color: #F97316;
  }
  
  &.status-paid {
    background: #ECFDF5;
    color: #10B981;
  }
  
  &.status-completed {
    background: #EFF6FF;
    color: #3B82F6;
  }
  
  &.status-cancelled {
    background: #F3F4F6;
    color: #6B7280;
  }
  
  &.status-refunded {
    background: #FEF2F2;
    color: #EF4444;
  }
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 26rpx;
  color: #64748B;
}

.meta-value {
  font-size: 26rpx;
  color: #1E293B;
}

.order-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 2rpx solid #F1F5F9;
}

.amount-label {
  font-size: 26rpx;
  color: #64748B;
}

.amount-value {
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 24rpx;
    font-weight: 600;
    color: #F97316;
    margin-right: 4rpx;
  }
  
  .number {
    font-size: 36rpx;
    font-weight: 700;
    color: #F97316;
    font-family: 'DIN Alternate', sans-serif;
  }
}
</style>
