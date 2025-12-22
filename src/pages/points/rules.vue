<template>
  <view class="rules-container">
    <!-- 如何获得积分 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">📈</text>
        <text class="section-title">如何获得积分</text>
      </view>
      <view class="rule-card">
        <view class="rule-item">
          <view class="rule-dot earn"></view>
          <view class="rule-content">
            <text class="rule-name">消费获得</text>
            <text class="rule-desc">每消费1元获得1积分</text>
          </view>
        </view>
        <view class="rule-item">
          <view class="rule-dot earn"></view>
          <view class="rule-content">
            <text class="rule-name">会员充值</text>
            <text class="rule-desc">充值会员卡赠送积分（根据等级）</text>
          </view>
        </view>
        <view class="rule-item">
          <view class="rule-dot earn"></view>
          <view class="rule-content">
            <text class="rule-name">活动奖励</text>
            <text class="rule-desc">参与活动获得额外积分</text>
          </view>
        </view>
        <view class="rule-item">
          <view class="rule-dot earn"></view>
          <view class="rule-content">
            <text class="rule-name">邀请好友</text>
            <text class="rule-desc">邀请好友注册成功送积分</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 如何使用积分 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">💰</text>
        <text class="section-title">如何使用积分</text>
      </view>
      <view class="rule-card">
        <view class="rule-item">
          <view class="rule-dot use"></view>
          <view class="rule-content">
            <text class="rule-name">积分抵扣</text>
            <text class="rule-desc">
              100积分=1元，支付时可抵扣订单金额
            </text>
          </view>
        </view>
        <view class="rule-item">
          <view class="rule-dot use"></view>
          <view class="rule-content">
            <text class="rule-name">使用限制</text>
            <text class="rule-desc">
              • 100积分起用，须为100的倍数<br/>
              • 最多抵扣订单金额的50%
            </text>
          </view>
        </view>
        <view class="rule-item">
          <view class="rule-dot use"></view>
          <view class="rule-content">
            <text class="rule-name">兑换商品</text>
            <text class="rule-desc">积分商城兑换礼品（即将上线）</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 会员等级权益 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🎁</text>
        <text class="section-title">会员等级权益</text>
      </view>
      
      <view class="level-list">
        <!-- 青铜会员 -->
        <view class="level-card bronze">
          <view class="level-header">
            <text class="level-icon">🥉</text>
            <view class="level-info">
              <text class="level-name">青铜会员 LV.1</text>
              <text class="level-points">0-999积分</text>
            </view>
          </view>
          <view class="level-benefits">
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">9.9折优惠</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">基础服务</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">积分奖励</text>
            </view>
          </view>
        </view>

        <!-- 白银会员 -->
        <view class="level-card silver">
          <view class="level-header">
            <text class="level-icon">🥈</text>
            <view class="level-info">
              <text class="level-name">白银会员 LV.2</text>
              <text class="level-points">1000-4999积分</text>
            </view>
          </view>
          <view class="level-benefits">
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">9.5折优惠</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">优先预约</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">生日礼包</text>
            </view>
          </view>
        </view>

        <!-- 黄金会员 -->
        <view class="level-card gold">
          <view class="level-header">
            <text class="level-icon">🥇</text>
            <view class="level-info">
              <text class="level-name">黄金会员 LV.3</text>
              <text class="level-points">5000+积分</text>
            </view>
          </view>
          <view class="level-benefits">
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">9折优惠</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">专属客服</text>
            </view>
            <view class="benefit-item">
              <text class="benefit-dot">•</text>
              <text class="benefit-text">免费寄养券</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 注意事项 -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">⚠️</text>
        <text class="section-title">注意事项</text>
      </view>
      <view class="notice-card">
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">积分永久有效，不设过期时间</text>
        </view>
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">积分不可转让，仅限本人使用</text>
        </view>
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">退款订单将扣回相应积分</text>
        </view>
        <view class="notice-item">
          <text class="notice-dot">•</text>
          <text class="notice-text">会员等级根据累计积分自动升级</text>
        </view>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="footer">
      <text class="footer-text">最终解释权归PetMaster所有</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 纯展示页面，无需额外逻辑
</script>

<style lang="scss">
.rules-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding: 32rpx 40rpx 80rpx;
}

/* 区块样式 */
.section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.section-icon {
  font-size: 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #1F2937;
}

/* 规则卡片 */
.rule-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 16rpx 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #F9FAFB;
  
  &:last-child {
    border-bottom: none;
  }
}

.rule-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-top: 12rpx;
  flex-shrink: 0;
  
  &.earn {
    background: #10B981;
  }
  
  &.use {
    background: #6366F1;
  }
}

.rule-content {
  flex: 1;
}

.rule-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.rule-desc {
  font-size: 26rpx;
  color: #6B7280;
  line-height: 1.6;
}

/* 会员等级卡片 */
.level-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.level-card {
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  border: 3rpx solid;
  
  &.bronze {
    background: linear-gradient(135deg, #FFF8F0 0%, #FFEFD5 100%);
    border-color: #CD7F32;
  }
  
  &.silver {
    background: linear-gradient(135deg, #F5F7FA 0%, #E8ECF1 100%);
    border-color: #C0C0C0;
  }
  
  &.gold {
    background: linear-gradient(135deg, #FFF9E6 0%, #FFE4A3 100%);
    border-color: #FFD700;
  }
}

.level-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.1);
}

.level-icon {
  font-size: 64rpx;
}

.level-info {
  flex: 1;
}

.level-name {
  display: block;
  font-size: 32rpx;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.level-points {
  font-size: 24rpx;
  color: #6B7280;
  font-weight: 600;
}

.level-benefits {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.benefit-dot {
  font-size: 24rpx;
  color: #1F2937;
  margin-top: 4rpx;
}

.benefit-text {
  font-size: 26rpx;
  color: #374151;
  line-height: 1.5;
}

/* 注意事项 */
.notice-card {
  background: #FEF3C7;
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid #FDE68A;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 16rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.notice-dot {
  font-size: 24rpx;
  color: #D97706;
  margin-top: 4rpx;
}

.notice-text {
  flex: 1;
  font-size: 26rpx;
  color: #92400E;
  line-height: 1.6;
}

/* 底部 */
.footer {
  text-align: center;
  padding: 40rpx 0 20rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>
