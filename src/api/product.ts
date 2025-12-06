/**
 * @description 商品管理API
 */

import { get } from '@/utils/request'

/** 商品信息 */
export interface Product {
    id: number
    name: string
    description?: string
    price: number
    stock: number
    category?: string
    image_url?: string
    is_active: boolean
    created_at: string
}

/**
 * 获取商品列表
 */
export const getProducts = (params?: { skip?: number; limit?: number; category?: string; name?: string }) => {
    return get<Product[]>('/products/', params)
}

/**
 * 获取商品详情
 * @param productId - 商品ID
 */
export const getProductDetail = (productId: number) => {
    return get<Product>(`/products/${productId}/`)
}
