/**
 * @description 用户相关API
 */

import { get, put } from '@/utils/request'

/** 用户信息 */
export interface User {
    id: number
    username: string
    mobile?: string
    email?: string
    role: string
    avatar?: string
    is_active: boolean
    points: number
    total_points: number
    member_level_id?: number
    created_at: string
    updated_at?: string
}

/** 用户更新参数 */
export interface UserUpdate {
    mobile?: string
    email?: string
    avatar?: string
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
    return get<User>('/users/me/')
}

/**
 * 获取用户详情
 * @param userId - 用户ID
 */
export const getUserDetail = (userId: number) => {
    return get<User>(`/users/${userId}/`)
}

/**
 * 更新当前用户信息
 * @param data - 更新数据
 */
export const updateCurrentUser = (data: UserUpdate) => {
    return put<User>('/users/me/', data)
}
