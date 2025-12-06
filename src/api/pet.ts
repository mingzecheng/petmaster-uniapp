/**
 * @description 宠物管理API
 */

import { get, post, put, del } from '@/utils/request'

/** 宠物信息 */
export interface Pet {
    id: number
    name: string
    species: string
    breed?: string
    age?: number
    gender?: string
    weight?: number
    owner_id: number
    image_url?: string
    description?: string
    created_at: string
    updated_at?: string
}

/** 创建宠物参数 */
export interface PetCreate {
    name: string
    species: string
    breed?: string
    age?: number
    gender?: string
    weight?: number
    owner_id: number
    description?: string
}

/** 更新宠物参数 */
export interface PetUpdate {
    name?: string
    species?: string
    breed?: string
    age?: number
    gender?: string
    weight?: number
    description?: string
    image_url?: string
}

/**
 * 获取宠物列表
 */
export const getPets = (params?: { skip?: number; limit?: number; owner_id?: number }) => {
    return get<Pet[]>('/pets/', params)
}

/**
 * 获取宠物详情
 * @param petId - 宠物ID
 */
export const getPetDetail = (petId: number) => {
    return get<Pet>(`/pets/${petId}/`)
}

/**
 * 创建宠物
 * @param data - 宠物数据
 */
export const createPet = (data: PetCreate) => {
    return post<Pet>('/pets/', data)
}

/**
 * 更新宠物信息
 * @param petId - 宠物ID
 * @param data - 更新数据
 */
export const updatePet = (petId: number, data: PetUpdate) => {
    return put<Pet>(`/pets/${petId}/`, data)
}

/**
 * 删除宠物
 * @param petId - 宠物ID
 */
export const deletePet = (petId: number) => {
    return del(`/pets/${petId}/`)
}

/** 健康记录 */
export interface HealthRecord {
    id: number
    pet_id: number
    record_date: string
    record_type: string
    description: string
    veterinarian?: string
    notes?: string
    created_at: string
}

/**
 * 获取宠物健康记录
 * @param petId - 宠物ID
 */
export const getPetHealthRecords = (petId: number, params?: { skip?: number; limit?: number }) => {
    return get<HealthRecord[]>(`/pets/${petId}/health-records/`, params)
}
