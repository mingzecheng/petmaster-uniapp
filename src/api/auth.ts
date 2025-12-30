/**
 * @description 认证相关API
 */

import { post } from '@/utils/request'

/** 登录响应 */
export interface LoginResponse {
    access_token: string
    token_type: string
}

/** 用户信息响应 */
export interface UserResponse {
    id: number
    username: string
    email?: string
    role: string
    avatar?: string
    is_active: boolean
    created_at: string
}

/**
 * 用户登录
 * @param data - 登录数据
 */
export const login = (data: { username: string; password: string; recaptcha_token?: string }) => {
    return post<LoginResponse>('/auth/login', data)
}

/**
 * 用户注册
 * @param data - 注册数据
 */
export const register = (data: { username: string; password: string; email?: string }) => {
    return post<UserResponse>('/auth/register', data)
}

/**
 * 发送邮箱验证码
 * @param data - 发送验证码数据
 */
export const sendEmailCode = (data: { email: string; scene: 'login' | 'register' }) => {
    return post<{ success: boolean; message: string }>('/auth/email/send', data)
}

/**
 * 邮箱验证码登录
 * @param data - 登录数据
 */
export const emailLogin = (data: { email: string; code: string }) => {
    return post<LoginResponse>('/auth/email/login', data)
}

/**
 * 邮箱验证码注册（注册后自动登录）
 * @param data - 注册数据
 */
export const emailRegister = (data: { email: string; code: string }) => {
    return post<LoginResponse>('/auth/email/register', data)
}
