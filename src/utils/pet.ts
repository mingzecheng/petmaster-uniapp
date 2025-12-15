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
 * 获取宠物头像（强制使用本地静态资源）
 * @param _imageUrl - (已废弃) 以前的图片URL
 * @param species - 宠物品种
 */
export const getPetAvatar = (_imageUrl?: string, species?: string): string => {
    // 强制统一使用本地静态资源
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
