/**
 * 颜色工具函数
 *
 */

/**
 * 计算颜色的相对亮度（Relative Luminance）
 *
 * 使用 WCAG 2.0 标准公式：
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getColorLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '')

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * 根据背景色自动选择文本颜色（黑/白）
 */
export function getContrastTextColor(
  bgColor: string,
  darkColor: string = '#262626',
  lightColor: string = '#ffffff',
): string {
  const luminance = getColorLuminance(bgColor)
  return luminance > 0.5 ? darkColor : lightColor
}

/**
 * 计算两种颜色之间的对比度
 *
 * Contrast = (L1 + 0.05) / (L2 + 0.05)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getColorLuminance(color1)
  const l2 = getColorLuminance(color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * HSL 颜色类型
 */
export interface HSL {
  h: number
  s: number
  l: number
}

/**
 * Hex -> HSL
 */
export function hexToHSL(hex: string): HSL {
  const cleanHex = hex.replace('#', '')

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  const l = (max + min) / 2

  let s = 0
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  }

  let h = 0
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * HSL -> Hex
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 降低颜色亮度（用于生成描边色）
 */
export function darkenByLightness(hex: string, amount: number = 10): string {
  const hsl = hexToHSL(hex)
  hsl.l = Math.max(0, hsl.l - amount)
  return hslToHex(hsl)
}

/**
 * 提升颜色亮度
 */
export function lightenByLightness(hex: string, amount: number = 10): string {
  const hsl = hexToHSL(hex)
  hsl.l = Math.min(100, hsl.l + amount)
  return hslToHex(hsl)
}
