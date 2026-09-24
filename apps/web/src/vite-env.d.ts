/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基地址；缺省走 Vite 代理的 /api */
  readonly VITE_API_BASE_URL?: string;
  /** 地图底图模式：street | outline | auto，默认 auto（瓦片不可达自动回落矢量轮廓） */
  readonly VITE_MAP_BASEMAP?: string;
  /** 瓦片模板 URL，默认 CARTO dark（{s}/{z}/{x}/{y}/{r} 占位符） */
  readonly VITE_MAP_TILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
