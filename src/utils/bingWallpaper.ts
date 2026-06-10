export const getBingWallpaperUrl = (uhd: boolean): string =>
    `https://bing.biturl.top/?resolution=${uhd ? 'UHD' : '1920'}&format=image&mkt=zh-CN`;
