/**
 * @description 本地存储工具模块
 */

/** Token存储键 */
const TOKEN_KEY = 'pet_master_token'
/** 用户信息存储键 */
const USER_KEY = 'pet_master_user'

/**
 * 获取Token
 * @returns Token字符串或null
 */
export const getToken = (): string | null => {
    return uni.getStorageSync(TOKEN_KEY) || null
}

/**
 * 设置Token
 * @param token - JWT Token
 */
export const setToken = (token: string): void => {
    uni.setStorageSync(TOKEN_KEY, token)
}

/**
 * 移除Token
 */
export const removeToken = (): void => {
    uni.removeStorageSync(TOKEN_KEY)
}

/**
 * 获取用户信息
 * @returns 用户信息对象或null
 */
export const getUser = <T = any>(): T | null => {
    const data = uni.getStorageSync(USER_KEY)
    return data ? JSON.parse(data) : null
}

/**
 * 设置用户信息
 * @param user - 用户信息对象
 */
export const setUser = <T = any>(user: T): void => {
    uni.setStorageSync(USER_KEY, JSON.stringify(user))
}

/**
 * 移除用户信息
 */
export const removeUser = (): void => {
    uni.removeStorageSync(USER_KEY)
}

/**
 * 清除所有登录相关信息
 */
export const clearAuth = (): void => {
    removeToken()
    removeUser()
}
