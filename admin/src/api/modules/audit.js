import { request } from '@/utils/api'

export default {
  // 批量审核
  batchAudit(data) {
    return request({
      url: '/admin/audit/batch',
      method: 'post',
      data
    })
  },

  // 获取审核日志
  getAuditLogs(params) {
    return request({
      url: '/admin/audit/logs',
      method: 'get',
      params
    })
  }
}
