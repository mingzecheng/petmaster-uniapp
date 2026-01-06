/**
 * @description 宠物相关工具函数
 */

/**
 * 根据宠物品种获取默认头像路径
 * 使用本地静态资源，每种动物一张图片
 */
export const getPetDefaultImage = (species?: string): string => {
    // 本地静态资源路径映射
    const images: Record<string, string> = {
        // 狗狗品种 - 统一使用狗狗图片
        '狗': '/static/dog.png',
        '柴犬': '/static/dog.png',
        '金毛': '/static/dog.png',
        '哈士奇': '/static/dog.png',
        '泰迪': '/static/dog.png',
        '柯基': '/static/dog.png',

        // 猫咪品种 - 统一使用猫咪图片
        '猫': '/static/cat.png',
        '英短': '/static/cat.png',
        '美短': '/static/cat.png',
        '布偶猫': '/static/cat.png',
        '加菲猫': '/static/cat.png',

        // 其他宠物
        '兔子': '/static/rabbit.png',
        '仓鼠': '/static/hamster.png'
    }

    // 优先匹配精确品种
    if (species && images[species]) {
        return images[species]
    }

    // 模糊匹配
    for (const [key, url] of Object.entries(images)) {
        if (species?.includes(key)) {
            return url
        }
    }

    // 默认返回通用宠物图片
    return '/static/pet-default.png'
}

/**
 * 获取宠物头像URL
 * 支持OSS完整URL、本地相对路径和默认图片
 * @param imageUrl - 图片URL（可以是OSS完整URL或本地相对路径）
 * @param species - 宠物品种（用于获取默认图片）
 */
export const getPetAvatar = (imageUrl?: string, species?: string): string => {
    // 如果有图片URL
    if (imageUrl) {
        // 如果是完整URL（OSS云存储），直接返回
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl
        }

        // 如果是相对路径（本地存储），拼接服务器地址
        // 从环境变量读取后端地址
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://petmaster-api.zeabur.app'
        // 确保路径以 /uploads 开头
        const imagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
        const fullPath = imagePath.startsWith('/uploads/') ? imagePath : `/uploads/${imageUrl}`
        return `${baseUrl}${fullPath}`
    }

    // 没有图片URL，使用默认图片
    return getPetDefaultImage(species)
}

/**
 * 根据宠物品种获取 Emoji 图标
 */
export const getPetEmoji = (species?: string): string => {
    const emojis: Record<string, string> = {
        '狗': '🐕',
        '柴犬': '🐕',
        '金毛': '🦮',
        '哈士奇': '🐺',
        '泰迪': '🐩',
        '柯基': '🐕',
        '猫': '🐱',
        '英短': '🐱',
        '美短': '😺',
        '布偶猫': '😻',
        '加菲猫': '😸',
        '兔子': '🐰',
        '仓鼠': '🐹'
    }

    if (species && emojis[species]) {
        return emojis[species]
    }

    for (const [key, emoji] of Object.entries(emojis)) {
        if (species?.includes(key)) {
            return emoji
        }
    }

    return '🐾'
}
