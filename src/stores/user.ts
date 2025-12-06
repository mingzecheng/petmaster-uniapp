/**
 * @description 用户状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser, clearAuth } from '@/utils/storage'
import { post, get } from '@/utils/request'

/** 用户信息接口 */
export interface UserInfo {
    id: number
    username: string
    mobile?: string
    email?: string
    role: 'admin' | 'staff' | 'member'
    avatar?: string
    points?: number
    member_level_id?: number
    member_level?: {
        id: number
        name: string
        discount: number
    }
}

/** 登录表单 */
export interface LoginForm {
    username: string
    password: string
    recaptcha_token?: string
}

/** 注册表单 */
export interface RegisterForm {
    username: string
    password: string
    mobile?: string
    email?: string
}

export const useUserStore = defineStore('user', () => {
    /** 用户Token */
    const token = ref<string | null>(getToken())

    /** 用户信息 */
    const userInfo = ref<UserInfo | null>(getUser())

    /** 是否已登录 */
    const isLoggedIn = computed(() => !!token.value)

    /** 用户名 */
    const username = computed(() => userInfo.value?.username || '')

    /** 用户积分 */
    const points = computed(() => userInfo.value?.points || 0)

    /**
     * 用户登录
     * @param form - 登录表单
     */
    const login = async (form: LoginForm): Promise<boolean> => {
        try {
            const res = await post<{ access_token: string; token_type: string }>('/auth/login', form)

            if (res.access_token) {
                token.value = res.access_token
                setToken(res.access_token)

                // 获取用户信息
                await fetchUserInfo()
                return true
            }
            return false
        } catch (error) {
            console.error('登录失败:', error)
            return false
        }
    }

    /**
     * 用户注册
     * @param form - 注册表单
     */
    const register = async (form: RegisterForm): Promise<boolean> => {
        try {
            await post('/auth/register', form)
            uni.showToast({ title: '注册成功，请登录', icon: 'success' })
            return true
        } catch (error) {
            console.error('注册失败:', error)
            return false
        }
    }

    /**
     * 获取用户信息
     */
    const fetchUserInfo = async (): Promise<void> => {
        try {
            const res = await get<UserInfo>('/users/me')
            userInfo.value = res
            setUser(res)
        } catch (error) {
            console.error('获取用户信息失败:', error)
        }
    }

    /**
     * 退出登录
     */
    const logout = (): void => {
        token.value = null
        userInfo.value = null
        clearAuth()
        uni.reLaunch({ url: '/pages/login/index' })
    }

    /**
     * 检查登录状态
     */
    const checkAuth = (): boolean => {
        if (!token.value) {
            uni.navigateTo({ url: '/pages/login/index' })
            return false
        }
        return true
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        username,
        points,
        login,
        register,
        fetchUserInfo,
        logout,
        checkAuth
    }
})
