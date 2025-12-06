<template>
  <view class="member-container">
    <!-- 会员卡展示 -->
    <view v-if="memberCard" class="card-wrapper">
      <view class="member-card">
        <view class="card-bg">
          <view class="card-pattern"></view>
        </view>
        <view class="card-content">
          <view class="card-header">
            <text class="card-title">PetMaster 会员卡</text>
            <text class="card-status" :class="memberCard.status">
              {{ statusText }}
            </text>
          </view>
          <view class="card-number">
            <text>{{ formatCardNumber(memberCard.card_number) }}</text>
          </view>
          <view class="card-info">
            <view class="info-item">
              <text class="info-label">余额</text>
              <text class="info-value">¥{{ memberCard.balance }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">累计充值</text>
              <text class="info-value">¥{{ memberCard.total_recharge }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 无会员卡 -->
    <view v-else class="no-card">
      <text class="no-card-icon">💳</text>
      <text class="no-card-text">暂无会员卡</text>
      <text class="no-card-hint">请联系店员办理会员卡</text>
    </view>

    <!-- 操作按钮 -->
    <view v-if="memberCard && memberCard.status === 'active'" class="action-wrapper">
      <button class="recharge-btn" @click="goToRecharge">
        <text>💰 充值</text>
      </button>
    </view>

    <!-- 充值记录 -->
    <view v-if="memberCard" class="records-section">
      <view class="section-header">
        <text class="section-title">充值记录</text>
      </view>
      <view v-if="records.length > 0" class="records-list">
        <view v-for="record in records" :key="record.id" class="record-item">
          <view class="record-info">
            <text class="record-amount">+¥{{ record.amount }}</text>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
          <view class="record-balance">
            <text>余额: ¥{{ record.balance_after }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-records">
        <text>暂无充值记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
 * 初始化
 */
onMounted(() => {
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
  background: #FFFDE7;
  padding: 30rpx;
}

/* 会员卡样式 */
.card-wrapper {
  margin-bottom: 40rpx;
}

.member-card {
  position: relative;
  height: 380rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(255, 171, 0, 0.3);
}

.card-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFD600 0%, #FF6D00 100%);
}

.card-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 40%);
}

.card-content {
  position: relative;
  height: 100%;
  padding: 36rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.card-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  
  &.frozen {
    background: rgba(255, 23, 68, 0.3);
  }
}

.card-number {
  text {
    font-size: 44rpx;
    font-weight: 300;
    color: #fff;
    letter-spacing: 4rpx;
  }
}

.card-info {
  display: flex;
  gap: 60rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

/* 无会员卡 */
.no-card {
  text-align: center;
  padding: 100rpx 0;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 40rpx;
}

.no-card-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.no-card-text {
  display: block;
  font-size: 32rpx;
  color: #424242;
  margin-bottom: 12rpx;
}

.no-card-hint {
  font-size: 26rpx;
  color: #BDBDBD;
}

/* 操作按钮 */
.action-wrapper {
  margin-bottom: 40rpx;
}

.recharge-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #FFD600, #FFAB00);
  border: none;
  border-radius: 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #212121;
  box-shadow: 0 12rpx 30rpx rgba(255, 214, 0, 0.4);
}

/* 充值记录 */
.records-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
  
  &:last-child {
    border-bottom: none;
  }
}

.record-amount {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #00C853;
  margin-bottom: 8rpx;
}

.record-time {
  font-size: 24rpx;
  color: #BDBDBD;
}

.record-balance {
  text {
    font-size: 26rpx;
    color: #757575;
  }
}

.empty-records {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #BDBDBD;
  }
}
</style>
