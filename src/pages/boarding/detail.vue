<template>
  <view class="boarding-detail-container">
    <!-- 顶部导航 -->
    <view class="nav-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="nav-title">寄养详情</text>
      <view class="placeholder-btn"></view>
    </view>

    <view class="content-scroll" v-if="boarding">
      <!-- 宠物信息卡片 -->
      <view class="pet-card">
        <view class="pet-header">
          <text class="pet-emoji">{{ getPetEmoji(boarding.pet?.species) }}</text>
          <view class="pet-info">
            <text class="pet-name">{{ boarding.pet?.name || '未知宠物' }}</text>
            <text class="pet-species">{{ boarding.pet?.species || '-' }}</text>
          </view>
          <view :class="['status-badge', boarding.status]">
            <view class="status-dot"></view>
            <text>{{ getStatusText(boarding.status) }}</text>
          </view>
        </view>
      </view>

      <!-- 寄养信息卡片 -->
      <view class="info-card">
        <view class="info-section">
          <text class="section-title">寄养时间</text>
          <view class="date-range">
            <view class="date-item">
              <text class="date-label">开始</text>
              <text class="date-value">{{ formatDate(boarding.start_date) }}</text>
            </view>
            <view class="date-divider">→</view>
            <view class="date-item">
              <text class="date-label">结束</text>
              <text class="date-value">{{ formatDate(boarding.end_date) }}</text>
            </view>
          </view>
          <view class="days-badge">
            <text>共 {{ calculateDays(boarding.start_date, boarding.end_date) }} 天</text>
          </view>
        </view>

        <view class="divider"></view>

        <view class="info-section">
          <text class="section-title">费用明细</text>
          <view class="cost-detail">
            <view class="cost-row">
              <text class="cost-label">每日费用</text>
              <text class="cost-value">¥{{ formatAmount(boarding.daily_rate) }}</text>
            </view>
            <view class="cost-row">
              <text class="cost-label">寄养天数</text>
              <text class="cost-value">× {{ calculateDays(boarding.start_date, boarding.end_date) }}</text>
            </view>
            <view class="cost-row total">
              <text class="cost-label">总费用</text>
              <text class="cost-value">¥{{ formatAmount(boarding.total_cost) }}</text>
            </view>
          </view>
        </view>

        <view class="divider" v-if="boarding.notes"></view>

        <view class="info-section" v-if="boarding.notes">
          <text class="section-title">备注信息</text>
          <view class="notes-box">
            <text>{{ boarding.notes }}</text>
          </view>
        </view>
      </view>

      <!-- 时间信息 -->
      <view class="time-card">
        <view class="time-row">
          <text class="time-label">创建时间</text>
          <text class="time-value">{{ formatDateTime(boarding.created_at) }}</text>
        </view>
        <view class="time-row">
          <text class="time-label">更新时间</text>
          <text class="time-value">{{ formatDateTime(boarding.updated_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar glass" v-if="boarding">
      <view class="action-left">
        <view class="action-icon-btn" @click="goToList">
          <text>📋</text>
          <text class="icon-label">列表</text>
        </view>
      </view>
      <view class="action-right" v-if="boarding.status === 'pending'">
        <button class="cancel-btn" @click="handleCancel">
          <text>取消寄养</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBoardingDetail, cancelBoarding, type Boarding, type BoardingStatus } from '@/api/boarding'

/** 寄养信息 */
const boarding = ref<Boarding | null>(null)

/** 寄养ID */
const boardingId = ref(0)

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
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.id) {
    boardingId.value = parseInt(currentPage.options.id)
    loadBoarding()
  }
})

/**
 * 加载寄养详情
 */
const loadBoarding = async () => {
  try {
    uni.showLoading({ title: '加载中' })
    const data = await getBoardingDetail(boardingId.value)
    boarding.value = data
  } catch (error) {
    console.error('加载寄养详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } finally {
    uni.hideLoading()
  }
}

/**
 * 获取宠物emoji
 */
const getPetEmoji = (species?: string): string => {
  const emojis: Record<string, string> = {
    '狗': '🐕',
    '猫': '🐱',
    '兔子': '🐰',
    '仓鼠': '🐹'
  }
  return emojis[species || ''] || '🐾'
}

/**
 * 获取状态文本
 */
const getStatusText = (status: BoardingStatus): string => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 */
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 计算天数
 */
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化金额
 */
const formatAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(2)
}

/**
 * 跳转列表
 */
const goToList = () => {
  uni.navigateTo({ url: '/pages/boarding/list' })
}

/**
 * 取消寄养
 */
const handleCancel = () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个寄养吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中' })
          await cancelBoarding(boardingId.value)
          uni.showToast({ title: '已取消', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (error) {
          console.error('取消寄养失败:', error)
          uni.showToast({ title: '取消失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}
</script>

<style lang="scss">
.boarding-detail-container {
  min-height: 100vh;
  background: #FAFAFA;
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

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}

.placeholder-btn {
  width: 72rpx;
}

/* 内容滚动 */
.content-scroll {
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
  padding-bottom: 200rpx;
}

/* 宠物卡片 */
.pet-card {
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.3);
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.pet-emoji {
  font-size: 64rpx;
  width: 96rpx;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pet-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1F2937;
}

.pet-species {
  font-size: 26rpx;
  color: #78350F;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  border-radius: 100rpx;
  background: rgba(255, 255, 255, 0.9);
  
  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }
  
  text {
    font-size: 24rpx;
    font-weight: 600;
  }
  
  &.pending { 
    .status-dot { background: #D97706; }
    text { color: #D97706; } 
  }
  &.active { 
    .status-dot { background: #2563EB; }
    text { color: #2563EB; } 
  }
  &.completed { 
    .status-dot { background: #059669; }
    text { color: #059669; } 
  }
  &.cancelled { 
    .status-dot { background: #9CA3AF; }
    text { color: #9CA3AF; } 
  }
}

/* 信息卡片 */
.info-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.info-section {
  margin-bottom: 32rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 20rpx;
}

.date-range {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.date-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
}

.date-label {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 8rpx;
}

.date-value {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 600;
}

.date-divider {
  font-size: 32rpx;
  color: #D1D5DB;
}

.days-badge {
  margin-top: 16rpx;
  text-align: center;
  padding: 12rpx 24rpx;
  background: #FFFBEB;
  border-radius: 100rpx;
  
  text {
    font-size: 26rpx;
    color: #B45309;
    font-weight: 600;
  }
}

.divider {
  height: 1rpx;
  background: #F3F4F6;
  margin: 32rpx 0;
}

.cost-detail {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.cost-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  
  &.total {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    padding: 20rpx;
    margin-top: 8rpx;
    
    .cost-label {
      font-size: 30rpx;
      font-weight: 700;
      color: #92400E;
    }
    
    .cost-value {
      font-size: 36rpx;
      font-weight: 700;
      color: #B45309;
    }
  }
}

.cost-label {
  font-size: 28rpx;
  color: #6B7280;
}

.cost-value {
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 600;
}

.notes-box {
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  
  text {
    font-size: 28rpx;
    color: #4B5563;
    line-height: 1.6;
  }
}

/* 时间卡片 */
.time-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 24rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.time-label {
  font-size: 26rpx;
  color: #9CA3AF;
}

.time-value {
  font-size: 26rpx;
  color: #6B7280;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 20rpx;
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.action-left {
  flex-shrink: 0;
}

.action-icon-btn {
  width: 96rpx;
  height: 96rpx;
  background: #F3F4F6;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  
  text {
    font-size: 32rpx;
  }
  
  .icon-label {
    font-size: 20rpx;
    color: #6B7280;
  }
  
  &:active {
    background: #E5E7EB;
  }
}

.action-right {
  flex: 1;
}

.cancel-btn {
  width: 100%;
  height: 96rpx;
  background: #FFFFFF;
  border: 2rpx solid #FECACA;
  border-radius: 32rpx;
  font-size: 30rpx;
  color: #EF4444;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after { border: none; }
  
  &:active {
    background: #FEF2F2;
  }
}
</style>
