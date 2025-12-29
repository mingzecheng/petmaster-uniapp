<template>
  <view class="create-appointment-container">
    <!-- 顶部导航 -->
    <view class="sub-header glass">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <text class="header-title">预约服务</text>
      <view class="header-placeholder"></view>
    </view>

    <view class="content-area">
      <!-- 步骤指示器 -->
      <view class="stepper">
        <view class="stepper-line"></view>
        <view 
          v-for="(stepItem, idx) in stepLabels" 
          :key="idx"
          :class="['step-item', { active: currentStep >= idx + 1, completed: currentStep > idx + 1 }]"
        >
          <view class="step-circle">
            <text v-if="currentStep > idx + 1" class="check-icon">✓</text>
            <text v-else>{{ idx + 1 }}</text>
          </view>
          <text class="step-label">{{ stepItem }}</text>
        </view>
      </view>

      <!-- 步骤内容 -->
      <view class="step-content">
        <!-- Step 1: 选择服务 (仅在未预选时显示) -->
        <view v-if="currentStep === 1 && !isServicePreselected" class="step-panel">
          <text class="step-title">选择服务项目</text>
          <view class="services-list">
            <view 
              v-for="service in services" 
              :key="service.id"
              :class="['service-card', { selected: selectedServiceId === service.id }]"
              @click="handleSelectService(service.id)"
            >
              <view :class="['service-icon', getServiceColorClass(service.name)]">
                <text>{{ getServiceIcon(service.name) }}</text>
              </view>
              <view class="service-info">
                <text class="service-name">{{ service.name }}</text>
                <text class="service-desc">{{ service.description || '专业服务' }}</text>
              </view>
              <view class="service-price-wrapper">
                <text class="service-price">¥{{ service.price }}</text>
              </view>
              <view v-if="selectedServiceId === service.id" class="selected-badge">
                <text>✓</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Step 2 (或 1 如果预选服务): 选择宠物 -->
        <view v-if="currentStep === (isServicePreselected ? 1 : 2)" class="step-panel">
          <text class="step-title">选择哪只爱宠？</text>
          <view class="pets-grid">
            <view 
              v-for="pet in pets" 
              :key="pet.id"
              :class="['pet-card', { selected: selectedPetId === pet.id }]"
              @click="handleSelectPet(pet.id)"
            >
              <view class="pet-avatar-wrapper">
                <image 
                  :src="getPetAvatar(pet.image_url, pet.species)" 
                  class="pet-avatar" 
                  mode="aspectFill"
                />
              </view>
              <text class="pet-name">{{ pet.name }}</text>
              <text class="pet-breed">{{ pet.species }}</text>
              <view v-if="selectedPetId === pet.id" class="selected-badge">
                <text>✓</text>
              </view>
            </view>
            
            <view class="pet-card add-new" @click="goToAddPet">
              <view class="add-icon-wrapper">
                <text class="add-icon">+</text>
              </view>
              <text class="add-label">添加新宠物</text>
            </view>
          </view>
        </view>

        <!-- Step 3 (或 2): 选择时间 -->
        <view v-if="currentStep === (isServicePreselected ? 2 : 3)" class="step-panel">
          <text class="step-title">预约时间</text>
          <view class="time-section">
            <picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
              <view class="time-picker">
                <text class="picker-label">日期</text>
                <text :class="['picker-value', { placeholder: !selectedDate }]">
                  {{ selectedDate || '请选择日期' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>

            <picker mode="time" :value="selectedTime" @change="onTimeChange">
              <view class="time-picker">
                <text class="picker-label">时间</text>
                <text :class="['picker-value', { placeholder: !selectedTime }]">
                  {{ selectedTime || '请选择时间' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>

        <!-- Step 4 (或 3): 确认信息 -->
        <view v-if="currentStep === maxStep" class="step-panel">
          <text class="step-title">确认信息</text>
          
          <view class="summary-card">
            <text class="summary-title">已选信息</text>
            
            <view class="summary-item">
              <view class="item-icon-wrapper service">
                <text class="item-emoji">{{ getServiceIcon(currentService?.name) }}</text>
              </view>
              <view class="item-info">
                <text class="item-label">服务项目</text>
                <text class="item-value">{{ currentService?.name }}</text>
              </view>
            </view>

            <view class="summary-item">
              <view class="item-icon-wrapper pet">
                <text class="item-emoji">{{ getPetEmoji(currentPet?.species) }}</text>
              </view>
              <view class="item-info">
                <text class="item-label">服务对象</text>
                <text class="item-value">{{ currentPet?.name }}</text>
              </view>
            </view>

            <view class="summary-item">
              <view class="item-icon-wrapper time">
                <text class="item-emoji">🕐</text>
              </view>
              <view class="item-info">
                <text class="item-label">预约时间</text>
                <text class="item-value">{{ formatTimeDisplay() }}</text>
              </view>
            </view>
          </view>

          <view class="notes-card">
            <text class="notes-title">备注信息</text>
            <textarea
              v-model="notes"
              placeholder="请输入备注信息（选填）"
              class="notes-textarea"
              maxlength="200"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar glass">
      <!-- 最后一步显示确认按钮 -->
      <button 
        v-if="currentStep === maxStep" 
        class="submit-btn" 
        :loading="loading" 
        @click="handleSubmit"
      >
        确认预约
      </button>
      
      <!-- 其他步骤显示下一步按钮 -->
      <button 
        v-else
        class="next-btn" 
        :disabled="!canGoNext"
        @click="goToNextStep"
      >
        下一步
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPets, type Pet } from '@/api/pet'
import { getServices, type Service } from '@/api/service'
import { createAppointment } from '@/api/appointment'
import { getPetAvatar, getPetEmoji } from '@/utils/pet'

/** 步骤标签 */
const stepLabels = ref<string[]>([])

/** 当前步骤 */
const currentStep = ref(1)

/** 是否预选了服务 */
const isServicePreselected = ref(false)

/** 最大步骤数 */
const maxStep = computed(() => isServicePreselected.value ? 3 : 4)

/** 宠物列表 */
const pets = ref<Pet[]>([])

/** 服务列表 */
const services = ref<Service[]>([])

/** 选中的宠物ID */
const selectedPetId = ref<number | null>(null)

/** 选中的服务ID */
const selectedServiceId = ref<number | null>(null)

/** 选中的日期 */
const selectedDate = ref('')

/** 选中的时间 */
const selectedTime = ref('')

/** 备注 */
const notes = ref('')

/** 加载状态 */
const loading = ref(false)

/** 最小日期 */
const minDate = new Date().toISOString().split('T')[0]

/** 当前选中的宠物 */
const currentPet = computed(() => {
  return pets.value.find(p => p.id === selectedPetId.value)
})

/** 当前选中的服务 */
const currentService = computed(() => {
  return services.value.find(s => s.id === selectedServiceId.value)
})

/**
 * 返回
 */
const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    uni.navigateBack()
  }
}

/**
 * 初始化
 */
onMounted(async () => {
  initDateTime()
  await Promise.all([loadPets(), loadServices()])
  
  // 从URL参数获取服务ID
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.serviceId) {
    selectedServiceId.value = parseInt(currentPage.options.serviceId)
    isServicePreselected.value = true
    stepLabels.value = ['宠物', '时间', '确认']
  } else {
    stepLabels.value = ['服务', '宠物', '时间', '确认']
  }
})

/**
 * 初始化日期和时间
 */
const initDateTime = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  selectedDate.value = tomorrow.toISOString().split('T')[0]
  selectedTime.value = '09:00'
}

/**
 * 加载宠物列表
 */
const loadPets = async () => {
  try {
    const data = await getPets()
    pets.value = data
  } catch (error) {
    console.error('加载宠物失败:', error)
  }
}

/**
 * 加载服务列表
 */
const loadServices = async () => {
  try {
    const data = await getServices()
    services.value = data
  } catch (error) {
    console.error('加载服务失败:', error)
  }
}

/**
 * 判断是否可以进入下一步
 */
const canGoNext = computed(() => {
  if (currentStep.value === 1) {
    // 第一步：需要选择服务（如果未预选）或宠物（如果预选了服务）
    return isServicePreselected.value ? selectedPetId.value !== null : selectedServiceId.value !== null
  } else if (currentStep.value === (isServicePreselected.value ? 1 : 2)) {
    // 选择宠物步骤
    return selectedPetId.value !== null
  } else if (currentStep.value === (isServicePreselected.value ? 2 : 3)) {
    // 选择时间步骤
    return selectedDate.value && selectedTime.value
  }
  return false
})

/**
 * 进入下一步
 */
const goToNextStep = () => {
  if (canGoNext.value) {
    currentStep.value++
  }
}

/**
 * 选择服务
 */
const handleSelectService = (id: number) => {
  selectedServiceId.value = id
}

/**
 * 选择宠物
 */
const handleSelectPet = (id: number) => {
  selectedPetId.value = id
}

/**
 * 日期变更
 */
const onDateChange = (e: any) => {
  selectedDate.value = e.detail.value
}

/**
 * 时间变更
 */
const onTimeChange = (e: any) => {
  selectedTime.value = e.detail.value
}

/**
 * 获取服务图标
 */
const getServiceIcon = (name?: string): string => {
  const icons: Record<string, string> = {
    '洗澡': '🛁',
    '美容': '✂️',
    '寄养': '🏠',
    '体检': '🩺',
    '驱虫': '💊',
    '疫苗': '💉'
  }
  for (const [key, icon] of Object.entries(icons)) {
    if (name?.includes(key)) return icon
  }
  return '✨'
}

/**
 * 获取服务颜色类
 */
const getServiceColorClass = (name?: string): string => {
  if (name?.includes('洗澡')) return 'color-blue'
  if (name?.includes('美容')) return 'color-purple'
  if (name?.includes('寄养')) return 'color-orange'
  if (name?.includes('体检')) return 'color-green'
  return 'color-gray'
}

/**
 * 格式化时间显示
 */
const formatTimeDisplay = (): string => {
  if (!selectedDate.value || !selectedTime.value) return ''
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${selectedTime.value}`
}

/**
 * 跳转添加宠物
 */
const goToAddPet = () => {
  uni.navigateTo({ url: '/pages/pet/add' })
}

/**
 * 提交预约
 */
const handleSubmit = async () => {
  if (!selectedPetId.value || !selectedServiceId.value || !selectedDate.value || !selectedTime.value) {
    uni.showToast({ title: '请完整填写信息', icon: 'none' })
    return
  }

  const selectedDateTime = new Date(`${selectedDate.value}T${selectedTime.value}`)
  const now = new Date()
  if (selectedDateTime < now) {
    uni.showToast({ title: '预约时间不能早于当前时间', icon: 'none' })
    return
  }

  const appointmentTime = `${selectedDate.value}T${selectedTime.value}:00`

  loading.value = true
  try {
    // 1. 创建预约
    const appointment = await createAppointment({
      pet_id: selectedPetId.value,
      service_id: selectedServiceId.value,
      appointment_time: appointmentTime,
      notes: notes.value || undefined
    })

    uni.showToast({ title: '预约创建成功', icon: 'success', duration: 1500 })

    // 获取服务信息
    const service = currentService.value
    if (!service) {
      throw new Error('服务信息不存在')
    }

    // 跳转到支付选项页面
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/payment/options?amount=${service.price}&subject=${encodeURIComponent(`预约服务 - ${service.name}`)}&related_id=${appointment.id}&related_type=appointment`
      })
    }, 1500)
  } catch (error) {
    console.error('预约失败:', error)
    uni.showToast({ 
      title: error instanceof Error ? error.message : '预约失败，请重试', 
      icon: 'none' 
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.create-appointment-container {
  min-height: 100vh;
  background: #FAFAFA;
  padding-bottom: 160rpx;
}

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

.content-area {
  padding: 32rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 120rpx);
}

.stepper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 60rpx;
  padding: 0 20rpx;
  position: relative;
}

.stepper-line {
  position: absolute;
  top: 28rpx;
  left: 80rpx;
  right: 80rpx;
  height: 4rpx;
  background: #E5E7EB;
  z-index: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  position: relative;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 0.5;
  
  &.active {
    opacity: 1;
  }
  
  &.completed .step-circle {
    background: #10B981;
    border-color: #10B981;
    box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
  }
}

.step-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4rpx solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #6B7280;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  .check-icon {
    color: #FFFFFF;
    font-size: 28rpx;
  }
}

.step-item.active .step-circle {
  background: #FFBF00;
  border-color: #FFBF00;
  color: #1F2937;
  box-shadow: 0 8rpx 20rpx rgba(251, 191, 36, 0.4);
  transform: scale(1.1);
}

.step-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #9CA3AF;
}

.step-item.active .step-label {
  color: #1F2937;
  font-weight: 700;
}

.step-content {
  min-height: 500rpx;
}

.step-panel {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 40rpx;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.service-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border: 3rpx solid transparent;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  
  &.selected {
    border-color: #FFBF00;
    background: #FFFBEB;
    transform: scale(1.02);
    box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.25);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.service-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
  
  &.color-blue { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
  &.color-purple { background: linear-gradient(135deg, #EDE9FE, #DDD6FE); }
  &.color-orange { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }
  &.color-green { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); }
  &.color-gray { background: linear-gradient(135deg, #F3F4F6, #E5E7EB); }
}

.service-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.service-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
}

.service-desc {
  font-size: 24rpx;
  color: #9CA3AF;
}

.service-price-wrapper {
  flex-shrink: 0;
}

.service-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #1F2937;
}

.selected-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 40rpx;
  height: 40rpx;
  background: #FFBF00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(251, 191, 36, 0.4);
  
  text {
    color: #FFFFFF;
    font-size: 20rpx;
    font-weight: 700;
  }
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.pet-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx 24rpx 32rpx;
  text-align: center;
  border: 3rpx solid transparent;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  
  &.selected {
    border-color: #FFBF00;
    background: #FFFBEB;
    transform: scale(1.02);
    box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.25);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.pet-avatar-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 20rpx;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  padding: 4rpx;
}

.pet-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #F3F4F6;
}

.pet-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8rpx;
}

.pet-breed {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
  display: inline-block;
}

.pet-card.add-new {
  background: #FFFFFF;
  border: 3rpx dashed #D1D5DB;
}

.add-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #F9FAFB;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 56rpx;
  color: #9CA3AF;
  font-weight: 300;
}

.add-label {
  font-size: 26rpx;
  color: #6B7280;
  font-weight: 600;
}

.time-section {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.time-picker {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s;
  
  &:active {
    background: #F3F4F6;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.picker-label {
  font-size: 28rpx;
  color: #6B7280;
  min-width: 100rpx;
  font-weight: 600;
}

.picker-value {
  flex: 1;
  font-size: 30rpx;
  color: #1F2937;
  font-weight: 600;
  
  &.placeholder {
    color: #9CA3AF;
    font-weight: 400;
  }
}

.picker-arrow {
  font-size: 36rpx;
  color: #D1D5DB;
  font-weight: 300;
}

.summary-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.summary-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24rpx;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.item-icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.service {
    background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
  }
  
  &.pet {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  }
  
  &.time {
    background: linear-gradient(135deg, #FCE7F3, #FBCFE8);
  }
}

.item-emoji {
  font-size: 32rpx;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.item-label {
  font-size: 22rpx;
  color: #9CA3AF;
  font-weight: 600;
}

.item-value {
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 700;
}

.notes-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.notes-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 20rpx;
}

.notes-textarea {
  width: 100%;
  min-height: 160rpx;
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #1F2937;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  z-index: 90;
  
  &.glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
}

.submit-btn,
.next-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
  box-shadow: 0 12rpx 32rpx rgba(31, 41, 55, 0.3);
  transition: all 0.2s;
  
  &::after { border: none; }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 6rpx 16rpx rgba(31, 41, 55, 0.2);
  }
  
  &[disabled] {
    opacity: 0.6;
    background: #D1D5DB;
    box-shadow: none;
    color: #F3F4F6;
  }
}

.next-btn {
  background: linear-gradient(135deg, #FFBF00 0%, #FF8F00 100%);
  color: #1F2937;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, 0.45);
  
  &:active {
    box-shadow: 0 6rpx 16rpx rgba(251, 191, 36, 0.35);
  }
}
</style>
