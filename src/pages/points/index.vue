<template>
  <view class="points-container">
    <!-- 顶部积分卡片 -->
    <view class="points-header" :style="{ paddingTop: (statusBarHeight + 40) + 'px' }">
      <!-- 返回按钮 -->
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      
      <view class="points-card">
        <view class="points-icon">💎</view>
        <text class="points-title">我的积分</text>
        <view class="points-balance">
          <text class="points-num">{{ stats.current_points }}</text>
          <text class="points-unit">积分</text>
        </view>
        
        <view class="points-stats">
          <view class="stat-item">
            <text class="stat-value">{{ stats.total_earned }}</text>
            <text class="stat-label">累计获得</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.total_used }}</text>
            <text class="stat-label">已使用</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 积分规则说明 -->
    <view class="section rules-section">
      <view class="section-card" @click="goToRules">
        <view class="rule-item">
          <text class="rule-icon">📈</text>
          <view class="rule-content">
            <text class="rule-title">如何获得积分</text>
            <text class="rule-desc">消费1元=1积分，充值有奖励</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="rule-divider"></view>
        <view class="rule-item">
          <text class="rule-icon">💰</text>
          <view class="rule-content">
            <text class="rule-title">如何使用积分</text>
            <text class="rule-desc">100积分=1元，支付时抵扣</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 积分明细列表 -->
    <view class="section records-section">
      <view class="section-header">
        <text class="section-title">积分明细</text>
      </view>

      <view v-if="loading && records.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无积分记录</text>
        <text class="empty-hint">快去消费获取积分吧~</text>
      </view>

      <view v-else class="records-list">
        <view 
          v-for="(group, index) in groupedRecords" 
          :key="index"
          class="record-group"
        >
          <view class="group-date">{{ group.date }}</view>
          <view class="group-items">
            <view 
              v-for="record in group.records" 
              :key="record.id"
              class="record-item"
            >
              <view class="record-left">
                <text class="record-reason">{{ record.reason }}</text>
                <text class="record-time">{{ formatTime(record.created_at) }}</text>
              </view>
              <view class="record-right">
                <text 
                  class="record-points"
                  :class="record.points > 0 ? 'points-add' : 'points-use'"
                >
                  {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                </text>
                <text class="record-balance">余额: {{ record.balance }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading" class="load-more" @click="loadMore">
        <text class="load-more-text">加载更多</text>
      </view>
      <view v-if="loading && records.length > 0" class="loading-more">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-if="!hasMore && records.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMyPointStats, getMyPointRecords, type PointStats, type PointRecord } from '@/api/points'

/** 状态栏高度 */
const statusBarHeight = ref(0)

/** 积分统计 */
const stats = ref<PointStats>({
  current_points: 0,
  total_earned: 0,
  total_used: 0
})

/** 积分记录列表 */
const records = ref<PointRecord[]>([])

/** 加载状态 */
const loading = ref(false)

/** 是否还有更多 */
const hasMore = ref(true)

/** 当前页码 */
const currentSkip = ref(0)

/** 每页数量 */
const pageSize = 20

/**
 * 按日期分组的记录
 */
const groupedRecords = computed(() => {
  const groups: { date: string; records: PointRecord[] }[] = []
  
  records.value.forEach(record => {
    const date = formatDate(record.created_at)
    let group = groups.find(g => g.date === date)
    
    if (!group) {
      group = { date, records: [] }
      groups.push(group)
    }
    
    group.records.push(record)
  })
  
  return groups
})

/**
 * 初始化
 */
onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
  
  await loadStats()
  await loadRecords()
})

/**
 * 加载积分统计
 */
const loadStats = async () => {
  try {
    const data = await getMyPointStats()
    stats.value = data
  } catch (error: any) {
    console.error('加载积分统计失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

/**
 * 加载积分记录
 */
const loadRecords = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const data = await getMyPointRecords(currentSkip.value, pageSize)
    
    if (currentSkip.value === 0) {
      records.value = data
    } else {
      records.value = [...records.value, ...data]
    }
    
    // 判断是否还有更多
    hasMore.value = data.length >= pageSize
    
  } catch (error: any) {
    console.error('加载积分记录失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多
 */
const loadMore = async () => {
  currentSkip.value += pageSize
  await loadRecords()
}

/**
 * 下拉刷新
 */
import { onPullDownRefresh } from '@dcloudio/uni-app'
onPullDownRefresh(async () => {
  currentSkip.value = 0
  hasMore.value = true
  await Promise.all([loadStats(), loadRecords()])
  uni.stopPullDownRefresh()
})

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return '今天'
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return '昨天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

/**
 * 格式化时间
 */
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 跳转到规则页面
 */
const goToRules = () => {
  uni.navigateTo({ url: '/pages/points/rules' })
}

/**
 * 返回上一页
 */
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss">
.points-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding-bottom: 40rpx;
}

/* 顶部积分卡片 */
.points-header {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  padding: 40rpx 40rpx 60rpx;
  margin-bottom: 40rpx;
  position: relative;
}

.back-btn {
  position: absolute;
  top: calc(var(--status-bar-height, 44px) + 50rpx);
  left: 40rpx;
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  
  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
  
  text {
    font-size: 36rpx;
    color: #FFFFFF;
    font-weight: 300;
    line-height: 1;
  }
}

.points-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 48rpx;
  padding: 48rpx 40rpx;
  text-align: center;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.points-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.points-title {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20rpx;
  font-weight: 500;
}

.points-balance {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 40rpx;
}

.points-num {
  font-size: 88rpx;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'DIN Alternate', sans-serif;
  letter-spacing: -2rpx;
}

.points-unit {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 12rpx;
  font-weight: 600;
}

.points-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding-top: 32rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 8rpx;
  font-family: 'DIN Alternate', sans-serif;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* 通用区块样式 */
.section {
  padding: 0 40rpx;
  margin-bottom: 32rpx;
}

.section-card {
  background: #FFFFFF;
  border-radius: 48rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1F2937;
}

/* 规则说明 */
.rule-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx 0;
  
  &:active {
    opacity: 0.7;
  }
}

.rule-icon {
  font-size: 48rpx;
  width: 80rpx;
  text-align: center;
}

.rule-content {
  flex: 1;
}

.rule-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.rule-desc {
  font-size: 24rpx;
  color: #6B7280;
}

.rule-divider {
  height: 2rpx;
  background: #F3F4F6;
  margin: 0 -32rpx;
  margin: 0 16rpx;
}

.arrow {
  font-size: 40rpx;
  color: #D1D5DB;
}

/* 积分记录 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.record-group {
  background: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.group-date {
  font-size: 26rpx;
  font-weight: 700;
  color: #6366F1;
  padding: 20rpx 32rpx;
  background: #F5F3FF;
  border-bottom: 2rpx solid #EDE9FE;
}

.group-items {
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 2rpx solid #F9FAFB;
  gap: 24rpx;
  
  &:last-child {
    border-bottom: none;
  }
}

.record-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.record-reason {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8rpx;
  word-break: break-all;
  line-height: 1.4;
}

.record-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

.record-right {
  text-align: right;
}

.record-points {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  margin-bottom: 6rpx;
  font-family: 'DIN Alternate', sans-serif;
  
  &.points-add {
    color: #10B981;
  }
  
  &.points-use {
    color: #EF4444;
  }
}

.record-balance {
  font-size: 22rpx;
  color: #9CA3AF;
}

/* 状态提示 */
.loading-state,
.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #9CA3AF;
}

.empty-icon {
  display: block;
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #9CA3AF;
}

.load-more,
.loading-more,
.no-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text {
  font-size: 28rpx;
  color: #6366F1;
  font-weight: 600;
}

.no-more-text {
  font-size: 26rpx;
  color: #9CA3AF;
}
</style>
