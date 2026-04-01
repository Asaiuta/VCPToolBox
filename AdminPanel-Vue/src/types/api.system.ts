/**
 * 系统监控相关类型定义
 */

/**
 * 系统资源信息
 */
export interface SystemResources {
  /** CPU 信息 */
  cpu: {
    /** 使用率百分比 (0-100) */
    usage: number
    /** CPU 核心数 */
    cores: number
    /** CPU 型号（如果可用） */
    model?: string
  }
  /** 内存信息 */
  memory: {
    /** 已用内存（字节） */
    used: number
    /** 总内存（字节） */
    total: number
    /** 使用率百分比 (0-100) */
    usage: number
  }
  /** 磁盘信息（如果可用） */
  disk?: {
    /** 已用空间（字节） */
    used: number
    /** 总空间（字节） */
    total: number
    /** 使用率百分比 (0-100) */
    usage: number
  }
  /** Node.js 进程信息 */
  nodeProcess?: {
    /** 内存使用详情（字节） */
    memory: {
      /** 进程占用的总内存 */
      rss: number
      /** 堆已使用内存 */
      heapUsed: number
      /** 堆总内存 */
      heapTotal: number
    }
    /** CPU 使用率 (0-100) */
    cpu?: number
    /** 运行时间（毫秒） */
    uptime: number
    /** 操作系统平台 */
    platform: string
    /** CPU 架构 */
    arch: string
    /** Node.js 版本号 */
    version: string
  }
}

/**
 * PM2 进程信息
 */
export interface PM2Process {
  /** 进程 ID */
  pid: number
  /** 进程名称 */
  name: string
  /** 运行状态 */
  status: 'online' | 'stopped' | 'errored' | 'launching'
  /** CPU 使用率 (0-100) */
  cpu: number
  /** 内存使用（字节） */
  memory: number
  /** 运行时间（毫秒） */
  uptime: number
  /** 重启次数 */
  restart: number
  /** 错误次数（如果有） */
  errors?: number
}

/**
 * 系统监控响应
 */
export interface SystemMonitorResponse {
  /** 系统资源信息 */
  system: SystemResources
  /** PM2 进程列表 */
  pm2?: PM2Process[]
}
