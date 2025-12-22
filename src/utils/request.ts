/**
 * @description HTTP请求工具模块
 * 基于uni.request封装，统一处理请求和响应
 */

import { getToken, clearAuth } from './storage'

/**
 * 获取API基础URL
 * - H5开发环境：使用相对路径，让Vite代理生效
 * - H5生产环境/小程序：使用完整的后端地址
 */
const getBaseUrl = (): string => {
    // #ifdef H5
    // H5 环境下，开发模式使用相对路径（Vite 代理）
    if (import.meta.env.DEV) {
        return '/api/v1'
    }
    // H5 生产环境，使用实际后端地址
    return 'http://127.0.0.1:8001/api/v1'
}

/** API基础URL */
const BASE_URL = getBaseUrl()

/** 请求方法类型 */
type RequestMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT'

/** 请求配置接口 */
interface RequestConfig {
    url: string
    method?: RequestMethod
    data?: any
    header?: Record<string, string>
    showLoading?: boolean
    showError?: boolean
}

/** 响应数据接口 */
interface ResponseData<T = any> {
    code?: number
    data?: T
    message?: string
    detail?: string
    error?: {
        type?: string
        code?: string
        message: string
    }
}

/**
 * 封装uni.request
 * @param config - 请求配置
 * @returns Promise响应数据
 */
export const request = <T = any>(config: RequestConfig): Promise<T> => {
    const {
        url,
        method = 'GET',
        data,
        header = {},
        showLoading = true,
        showError = true
    } = config

    // 显示加载提示
    if (showLoading) {
        uni.showLoading({ title: '加载中...', mask: true })
    }

    // 获取Token
    const token = getToken()
    if (token) {
        header['Authorization'] = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + url,
            method: method as any,
            data,
            header: {
                'Content-Type': 'application/json',
                ...header
            },
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                if (showLoading) {
                    uni.hideLoading()
                }

                const statusCode = res.statusCode
                const responseData = res.data as ResponseData<T>

                // 处理成功响应
                if (statusCode >= 200 && statusCode < 300) {
                    resolve(responseData as unknown as T)
                    return
                }

                // 检查是否为认证错误（401或ForbiddenError）
                const isForbiddenError = responseData.error?.type === 'ForbiddenError'
                const isAuthError = statusCode === 401 || isForbiddenError

                // 处理认证错误：JWT过期或无效
                if (isAuthError) {
                    clearAuth()
                    if (showError) {
                        uni.showToast({
                            title: '登录已过期，请重新登录',
                            icon: 'none',
                            duration: 1500
                        })
                    }
                    setTimeout(() => {
                        uni.reLaunch({ url: '/pages/login/index' })
                    }, 1500)
                    reject(new Error('认证失败'))
                    return
                }

                // 处理其他错误
                const errorMessage = responseData.error?.message || responseData.detail || responseData.message || '请求失败'
                if (showError) {
                    uni.showToast({ title: errorMessage, icon: 'none' })
                }
                reject(new Error(errorMessage))
            },
            fail: (err: UniApp.GeneralCallbackResult) => {
                if (showLoading) {
                    uni.hideLoading()
                }
                if (showError) {
                    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
                }
                reject(new Error(err.errMsg || '网络错误'))
            }
        })
    })
}

/**
 * GET请求
 * @param url - 请求地址
 * @param data - 请求参数
 * @param config - 额外配置
 */
export const get = <T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
): Promise<T> => {
    return request<T>({ url, method: 'GET', data, ...config })
}

/**
 * POST请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 额外配置
 */
export const post = <T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
): Promise<T> => {
    return request<T>({ url, method: 'POST', data, ...config })
}

/**
 * PUT请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 额外配置
 */
export const put = <T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
): Promise<T> => {
    return request<T>({ url, method: 'PUT', data, ...config })
}

/**
 * DELETE请求
 * @param url - 请求地址
 * @param data - 请求参数
 * @param config - 额外配置
 */
export const del = <T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
): Promise<T> => {
    return request<T>({ url, method: 'DELETE', data, ...config })
}

/**
 * PATCH请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 额外配置
 */
export const patch = <T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
): Promise<T> => {
    return request<T>({ url, method: 'PUT', data, ...config })
}
