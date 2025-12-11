<template>
  <view class="records-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">消费记录</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 筛选标签 -->
      <view class="filter-tabs">
        <view 
          v-for="tab in filterTabs" 
          :key="tab.value"
          :class="['tab-item', { active: currentFilter === tab.value }]"
          @click="selectFilter(tab.value)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <!-- 记录列表 -->
      <scroll-view class="records-scroll" scroll-y @scrolltolower="loadMore">
        <view v-if="records.length > 0" class="records-list">
          <view 
            v-for="record in records" 
            :key="record.id" 
            class="record-card"
          >
            <view class="record-icon" :class="getTypeClass(record.related_type)">
              <text>{{ getTypeIcon(record.related_type) }}</text>
            </view>
            <view class="record-info">
              <text class="record-title">{{ record.subject }}</text>
              <text class="record-time">{{ formatTime(record.created_at) }}</text>
            </view>
            <view class="record-right">
              <text class="record-amount" :class="{ refund: record.status === 'cancelled' }">
                {{ record.status === 'cancelled' ? '' : '-' }}¥{{ record.amount }}
              </text>
              <view class="record-status" :class="record.status">
                <text>{{ getStatusText(record.status) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!loading" class="empty-state">
          <view class="empty-icon-box">
            <text>📋</text>
          </view>
          <text class="empty-title">暂无消费记录</text>
          <text class="empty-desc">您的消费记录将展示在这里</text>
        </view>

        <view v-if="loading" class="loading-box">
          <text>加载中...</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * @description 消费记录页面
 * 展示用户的所有支付记录
 */

import { ref, onMounted } from 'vue'
import { getPaymentRecords, type PaymentRecord } from '@/api/payment'

/** 筛选标签 */
const filterTabs = [
  { label: '全部', value: '' },
  { label: '充值', value: 'member_card_recharge' },
  { label: '商品', value: 'product' },
  { label: '预约', value: 'appointment' }
]

/** 当前筛选 */
const currentFilter = ref('')

/** 消费记录列表 */
const records = ref<PaymentRecord[]>([])

/** 加载状态 */
const loading = ref(false)

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

/**
 * 初始化
 */
onMounted(() => {
  loadRecords()
})

/**
 * 加载消费记录
 */
const loadRecords = async () => {
  loading.value = true
  try {
    const params: any = { limit: 50 }
    if (currentFilter.value) {
      // 服务端暂不支持按类型筛选，先在前端处理
    }
    const data = await getPaymentRecords(params)
    records.value = currentFilter.value 
      ? data.filter(r => r.related_type === currentFilter.value)
      : data
  } catch (error) {
    console.error('加载消费记录失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择筛选
 */
const selectFilter = (filter: string) => {
  currentFilter.value = filter
  loadRecords()
}

/**
 * 加载更多
 */
const loadMore = () => {
  // 暂不分页
}

/**
 * 获取类型图标
 */
const getTypeIcon = (type?: string): string => {
  const icons: Record<string, string> = {
    'member_card_recharge': '💳',
    'product': '🛍️',
    'appointment': '📅'
  }
  return icons[type || ''] || '💰'
}

/**
 * 获取类型样式类
 */
const getTypeClass = (type?: string): string => {
  const classes: Record<string, string> = {
    'member_card_recharge': 'recharge',
    'product': 'product',
    'appointment': 'appointment'
  }
  return classes[type || ''] || ''
}

/**
 * 获取状态文本
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
</script>

<style lang="scss">
.records-container {
  min-height: 100vh;
  background: #FAFAFA;
}

/* 顶部导航 */
.sub-header {
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
  
  &.glass {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 48rpx;
    color: #374151;
    line-height: 1;
  }
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}

.header-placeholder {
  width: 72rpx;
}

/* 内容区域 */
.content-area {
  padding-top: calc(var(--status-bar-height, 44px) + 100rpx);
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 16rpx;
  overflow-x: auto;
}

.tab-item {
  flex-shrink: 0;
  padding: 16rpx 28rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #6B7280;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  
  &.active {
    background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
    color: #1F2937;
    font-weight: 600;
    box-shadow: 0 6rpx 20rpx rgba(251, 191, 36, 0.35);
  }
}

/* 记录列表 */
.records-scroll {
  height: calc(100vh - 280rpx);
  padding: 0 32rpx;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 40rpx;
}

.record-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.record-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  
  text {
    font-size: 32rpx;
  }
  
  &.recharge { background: #FEF3C7; }
  &.product { background: #DBEAFE; }
  &.appointment { background: #D1FAE5; }
}

.record-info {
  flex: 1;
}

.record-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 6rpx;
}

.record-time {
  font-size: 22rpx;
  color: #9CA3AF;
}

.record-right {
  text-align: right;
}

.record-amount {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 6rpx;
  
  &.refund {
    color: #10B981;
  }
}

.record-status {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  
  text {
    font-size: 20rpx;
  }
  
  &.pending { background: #FEF3C7; text { color: #D97706; } }
  &.paid { background: #D1FAE5; text { color: #059669; } }
  &.failed { background: #FEE2E2; text { color: #DC2626; } }
  &.cancelled { background: #F3F4F6; text { color: #9CA3AF; } }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.empty-icon-box {
  width: 120rpx;
  height: 120rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  
  text {
    font-size: 56rpx;
    opacity: 0.5;
  }
}

.empty-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #9CA3AF;
}

.loading-box {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}
</style>
