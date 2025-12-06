<template>
  <view class="create-appointment-container">
    <view class="form-card">
      <!-- 选择宠物 -->
      <view class="form-section">
        <text class="section-title">🐾 选择宠物</text>
        <scroll-view class="pets-scroll" scroll-x>
          <view class="pets-wrapper">
            <view 
              v-for="pet in pets" 
              :key="pet.id"
              :class="['pet-item', { active: selectedPetId === pet.id }]"
              @click="selectPet(pet.id)"
            >
              <text class="pet-emoji">{{ getPetEmoji(pet.species) }}</text>
              <text class="pet-name">{{ pet.name }}</text>
            </view>
          </view>
        </scroll-view>
        <view v-if="pets.length === 0" class="no-pet">
          <text>暂无宠物，</text>
          <text class="add-pet-link" @click="goToAddPet">去添加</text>
        </view>
      </view>

      <!-- 选择服务 -->
      <view class="form-section">
        <text class="section-title">✨ 选择服务</text>
        <view class="services-grid">
          <view 
            v-for="service in services" 
            :key="service.id"
            :class="['service-item', { active: selectedServiceId === service.id }]"
            @click="selectService(service.id)"
          >
            <text class="service-icon">{{ getServiceIcon(service.name) }}</text>
            <text class="service-name">{{ service.name }}</text>
            <text class="service-price">¥{{ service.price }}</text>
          </view>
        </view>
      </view>

      <!-- 选择时间 -->
      <view class="form-section">
        <text class="section-title">🕐 预约时间</text>
        <picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
          <view class="date-picker">
            <text class="picker-label">日期</text>
            <text class="picker-value">{{ selectedDate || '请选择日期' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
        <picker mode="time" :value="selectedTime" @change="onTimeChange">
          <view class="time-picker">
            <text class="picker-label">时间</text>
            <text class="picker-value">{{ selectedTime || '请选择时间' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <!-- 备注 -->
      <view class="form-section">
        <text class="section-title">📝 备注</text>
        <textarea
          v-model="notes"
          placeholder="请输入备注信息（选填）"
          class="notes-textarea"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-wrapper">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        确认预约
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPets, type Pet } from '@/api/pet'
import { getServices, type Service } from '@/api/service'
import { createAppointment } from '@/api/appointment'

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

/**
 * 初始化
 */
onMounted(async () => {
  await Promise.all([loadPets(), loadServices()])
  
  // 从URL参数获取服务ID
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  if (currentPage?.options?.serviceId) {
    selectedServiceId.value = parseInt(currentPage.options.serviceId)
  }
})

/**
 * 加载宠物列表
 */
const loadPets = async () => {
  try {
    const data = await getPets()
    pets.value = data
    if (data.length > 0) {
      selectedPetId.value = data[0].id
    }
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
 * 选择宠物
 */
const selectPet = (id: number) => {
  selectedPetId.value = id
}

/**
 * 选择服务
 */
const selectService = (id: number) => {
  selectedServiceId.value = id
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
 * 获取宠物emoji
 */
const getPetEmoji = (species: string): string => {
  const emojis: Record<string, string> = {
    '狗': '🐕',
    '猫': '🐱',
    '兔子': '🐰',
    '仓鼠': '🐹'
  }
  return emojis[species] || '🐾'
}

/**
 * 获取服务图标
 */
const getServiceIcon = (name: string): string => {
  const icons: Record<string, string> = {
    '洗澡': '🛁',
    '美容': '✂️',
    '寄养': '🏠',
    '体检': '🩺',
    '驱虫': '💊',
    '疫苗': '💉'
  }
  for (const [key, icon] of Object.entries(icons)) {
    if (name.includes(key)) return icon
  }
  return '🐾'
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
  if (!selectedPetId.value) {
    uni.showToast({ title: '请选择宠物', icon: 'none' })
    return
  }
  if (!selectedServiceId.value) {
    uni.showToast({ title: '请选择服务', icon: 'none' })
    return
  }
  if (!selectedDate.value) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return
  }
  if (!selectedTime.value) {
    uni.showToast({ title: '请选择时间', icon: 'none' })
    return
  }

  const appointmentTime = `${selectedDate.value}T${selectedTime.value}:00`

  loading.value = true
  try {
    await createAppointment({
      pet_id: selectedPetId.value,
      service_id: selectedServiceId.value,
      appointment_time: appointmentTime,
      notes: notes.value || undefined
    })

    uni.showToast({ title: '预约成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/appointment/list' })
    }, 1000)
  } catch (error) {
    console.error('预约失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.create-appointment-container {
  min-height: 100vh;
  background: #FFFDE7;
  padding: 30rpx;
  padding-bottom: 200rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 40rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
  margin-bottom: 24rpx;
}

/* 宠物选择 */
.pets-scroll {
  white-space: nowrap;
}

.pets-wrapper {
  display: inline-flex;
  gap: 20rpx;
}

.pet-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 140rpx;
  padding: 20rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  
  &.active {
    background: linear-gradient(135deg, #FFF9C4, #FFE57F);
    border-color: #FFD600;
  }
}

.pet-emoji {
  font-size: 44rpx;
  margin-bottom: 8rpx;
}

.pet-name {
  font-size: 24rpx;
  color: #212121;
}

.no-pet {
  padding: 30rpx;
  text-align: center;
  
  text {
    font-size: 26rpx;
    color: #757575;
  }
}

.add-pet-link {
  color: #2979FF !important;
  font-weight: 600;
}

/* 服务选择 */
.services-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.service-item {
  width: calc(33.33% - 14rpx);
  padding: 20rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  text-align: center;
  
  &.active {
    background: linear-gradient(135deg, #FFF9C4, #FFE57F);
    border-color: #FFD600;
  }
}

.service-icon {
  display: block;
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.service-name {
  display: block;
  font-size: 24rpx;
  color: #212121;
  margin-bottom: 4rpx;
}

.service-price {
  font-size: 24rpx;
  color: #FF6D00;
  font-weight: 600;
}

/* 时间选择 */
.date-picker,
.time-picker {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.picker-label {
  font-size: 28rpx;
  color: #757575;
  margin-right: 20rpx;
}

.picker-value {
  flex: 1;
  font-size: 28rpx;
  color: #212121;
}

.picker-arrow {
  font-size: 20rpx;
  color: #BDBDBD;
}

/* 备注 */
.notes-textarea {
  width: 100%;
  height: 160rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #212121;
}

/* 提交按钮 */
.submit-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
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
</style>
