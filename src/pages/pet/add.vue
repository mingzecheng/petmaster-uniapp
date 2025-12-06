<template>
  <view class="add-pet-container">
    <view class="form-card">
      <!-- 基本信息 -->
      <view class="form-section">
        <text class="section-title">🐾 基本信息</text>
        
        <view class="form-item">
          <text class="form-label">宠物名称 *</text>
          <input
            type="text"
            v-model="formData.name"
            placeholder="请输入宠物名称"
            class="form-input"
          />
        </view>

        <view class="form-item">
          <text class="form-label">宠物类型 *</text>
          <picker :range="speciesList" @change="onSpeciesChange">
            <view class="form-picker">
              <text>{{ formData.species || '请选择' }}</text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">品种</text>
          <input
            type="text"
            v-model="formData.breed"
            placeholder="请输入品种（选填）"
            class="form-input"
          />
        </view>
      </view>

      <!-- 详细信息 -->
      <view class="form-section">
        <text class="section-title">📋 详细信息</text>

        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="gender-group">
            <view 
              :class="['gender-btn', { active: formData.gender === 'male' }]"
              @click="formData.gender = 'male'"
            >
              <text>♂ 公</text>
            </view>
            <view 
              :class="['gender-btn', { active: formData.gender === 'female' }]"
              @click="formData.gender = 'female'"
            >
              <text>♀ 母</text>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-item half">
            <text class="form-label">年龄</text>
            <input
              type="number"
              v-model="formData.age"
              placeholder="岁"
              class="form-input"
            />
          </view>
          <view class="form-item half">
            <text class="form-label">体重</text>
            <input
              type="digit"
              v-model="formData.weight"
              placeholder="kg"
              class="form-input"
            />
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">描述</text>
          <textarea
            v-model="formData.description"
            placeholder="添加一些关于宠物的描述（选填）"
            class="form-textarea"
          />
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-wrapper">
      <button class="submit-btn" :loading="loading" @click="handleSubmit">
        保存
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createPet, type PetCreate } from '@/api/pet'
import { useUserStore } from '@/stores/user'

/** 表单数据 */
const formData = reactive<PetCreate>({
  name: '',
  species: '',
  breed: '',
  gender: '',
  age: undefined,
  weight: undefined,
  description: '',
  owner_id: 0
})

/** 宠物类型列表 */
const speciesList = ['狗', '猫', '兔子', '仓鼠', '鸟', '鱼', '其他']

/** 加载状态 */
const loading = ref(false)

/** 用户Store */
const userStore = useUserStore()

/**
 * 选择宠物类型
 */
const onSpeciesChange = (e: any) => {
  formData.species = speciesList[e.detail.value]
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入宠物名称', icon: 'none' })
    return false
  }
  if (!formData.species) {
    uni.showToast({ title: '请选择宠物类型', icon: 'none' })
    return false
  }
  return true
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  if (!userStore.userInfo?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  loading.value = true
  try {
    formData.owner_id = userStore.userInfo.id
    await createPet({
      ...formData,
      age: formData.age ? Number(formData.age) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined
    })

    uni.showToast({ title: '添加成功', icon: 'success' })
    
    // 通知列表刷新
    uni.$emit('refreshPets')
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('添加宠物失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.add-pet-container {
  min-height: 100vh;
  background: #FFFDE7;
  padding: 30rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #212121;
  margin-bottom: 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #424242;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #212121;
}

.form-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #212121;
}

.picker-arrow {
  font-size: 20rpx;
  color: #BDBDBD;
}

.form-row {
  display: flex;
  gap: 20rpx;
}

.form-item.half {
  flex: 1;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #212121;
}

/* 性别选择 */
.gender-group {
  display: flex;
  gap: 20rpx;
}

.gender-btn {
  flex: 1;
  height: 88rpx;
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #757575;
  
  &.active {
    background: linear-gradient(135deg, #FFF9C4, #FFE57F);
    border-color: #FFD600;
    color: #212121;
    font-weight: 600;
  }
}

/* 提交按钮 */
.submit-wrapper {
  margin-top: 40rpx;
  padding-bottom: 60rpx;
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
