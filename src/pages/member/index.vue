<template>
  <view class="member-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">会员中心</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 会员卡展示 -->
      <view v-if="memberCard" class="card-section">
        <view class="member-card">
          <view class="card-decoration"></view>
          <view class="card-content">
            <view class="card-top">
              <text class="card-brand">PetMaster 会员卡</text>
              <view class="card-status" :class="memberCard.status">
                <text>{{ statusText }}</text>
              </view>
            </view>
            <view class="card-number">
              <text>{{ formatCardNumber(memberCard.card_number) }}</text>
            </view>
            <view class="card-stats">
              <view class="stat-item">
                <text class="stat-label">余额</text>
                <text class="stat-value">¥{{ Number(memberCard.balance || 0).toFixed(2) }}</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">累计充值</text>
                <text class="stat-value">¥{{ Number(memberCard.total_recharge || 0).toFixed(2) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 无会员卡 -->
      <view v-else class="no-card-section">
        <view class="no-card-card">
          <text class="no-card-icon">💳</text>
          <text class="no-card-title">暂无会员卡</text>
          <text class="no-card-desc">请联系店员办理会员卡</text>
        </view>
      </view>

      <!-- 充值按钮 -->
      <view v-if="memberCard && memberCard.status === 'active'" class="recharge-section">
        <button class="recharge-btn" @click="goToRecharge">
          <text class="btn-icon">💰</text>
          <text class="btn-text">充值</text>
        </button>
      </view>

      <!-- 充值记录 -->
      <view v-if="memberCard" class="records-section">
        <view class="section-card">
          <view class="section-header">
            <text class="section-icon">📝</text>
            <text class="section-title">充值记录</text>
          </view>
          <view v-if="records.length > 0" class="records-timeline">
            <view v-for="record in records" :key="record.id" class="record-item">
              <view class="timeline-dot"></view>
              <view class="record-content">
                <view class="record-row">
                  <text class="record-amount">+¥{{ record.amount }}</text>
                  <text class="record-balance">余额: ¥{{ record.balance_after }}</text>
                </view>
                <text class="record-time">{{ formatTime(record.created_at) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-records">
            <text>暂无充值记录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMyMemberCard, getRechargeRecords, type MemberCard, type RechargeRecord } from '@/api/member'
import { useUserStore } from '@/stores/user'

/** 会员卡信息 */
const memberCard = ref<MemberCard | null>(null)

/** 充值记录 */
const records = ref<RechargeRecord[]>([])

/** 用户Store */
const userStore = useUserStore()

/** 状态文本 */
const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    active: '正常',
    frozen: '已冻结',
    cancelled: '已注销'
  }
  return statusMap[memberCard.value?.status || ''] || ''
})

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
  loadMemberCard()
})

/**
 * 页面显示时刷新数据
 */
onShow(() => {
  loadMemberCard()
})

/**
 * 加载会员卡信息
 */
const loadMemberCard = async () => {
  if (!userStore.userInfo?.id) return

  try {
    const card = await getMyMemberCard(userStore.userInfo.id)
    memberCard.value = card
    
    // 加载充值记录
    if (card) {
      const recordsData = await getRechargeRecords(card.id)
      records.value = recordsData
    }
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('暂无')) {
      memberCard.value = null
    } else {
      console.error('加载会员卡失败:', error)
    }
  }
}

/**
 * 格式化卡号
 */
const formatCardNumber = (num: string): string => {
  return num.replace(/(\d{4})/g, '$1 ').trim()
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * 跳转充值
 */
const goToRecharge = () => {
  if (memberCard.value) {
    uni.navigateTo({ url: `/pages/member/recharge?cardId=${memberCard.value.id}` })
  }
}
</script>

<style lang="scss">
.member-container {
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
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 140rpx);
}

/* 会员卡区域 */
.card-section {
  margin-bottom: 32rpx;
}

.member-card {
  position: relative;
  height: 360rpx;
  border-radius: 40rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 50%, #D97706 100%);
  box-shadow: 0 20rpx 50rpx rgba(251, 191, 36, 0.4);
}

.card-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 40%);
}

.card-content {
  position: relative;
  height: 100%;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-brand {
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.card-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.25);
  
  text {
    font-size: 24rpx;
    color: #FFFFFF;
  }
  
  &.frozen {
    background: rgba(239, 68, 68, 0.3);
  }
}

.card-number {
  text {
    font-size: 44rpx;
    font-weight: 300;
    color: #FFFFFF;
    letter-spacing: 6rpx;
  }
}

.card-stats {
  display: flex;
  gap: 60rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
}

/* 无会员卡 */
.no-card-section {
  margin-bottom: 32rpx;
}

.no-card-card {
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.no-card-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.no-card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12rpx;
}

.no-card-desc {
  font-size: 26rpx;
  color: #9CA3AF;
}

/* 充值按钮 */
.recharge-section {
  margin-bottom: 32rpx;
}

.recharge-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(31, 41, 55, 0.25);
  
  &::after { border: none; }
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
}

/* 充值记录 */
.records-section {
  margin-bottom: 40rpx;
}

.section-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.section-icon {
  font-size: 28rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

/* 时间线 */
.records-timeline {
  padding-left: 16rpx;
}

.record-item {
  position: relative;
  padding-left: 32rpx;
  padding-bottom: 24rpx;
  border-left: 4rpx solid #E5E7EB;
  
  &:last-child {
    border-left-color: transparent;
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -12rpx;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  background: #10B981;
  border-radius: 50%;
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.3);
}

.record-content {
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 20rpx;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #10B981;
}

.record-balance {
  font-size: 24rpx;
  color: #6B7280;
}

.record-time {
  font-size: 22rpx;
  color: #9CA3AF;
}

.empty-records {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}
</style>
