const configManager = require("../utils/config-manager");
const logger = require("../../config/logger");

/**
 * 审核服务 - 处理内容审核逻辑
 */
class AuditService {
  /**
   * 评估帖子内容，确定审核状态
   * @param {Object} params - 评估参数
   * @param {string} params.title - 帖子标题
   * @param {string} params.content - 帖子内容
   * @returns {Promise<Object>} 审核结果 { status: string, reason?: string }
   */
  async evaluatePostContent({ title, content }) {
    const settings = await configManager.getAuditSettings();

    // 1. 检查是否开启强制人工审核
    if (settings.forceManualAudit) {
      const result = { status: "pending", reason: "force_manual_audit" };
      logger.debug("AuditService: 强制人工审核触发", result);
      return result;
    }

    // 2. 检查拒绝关键词
    if (settings.autoRejectKeywords) {
      const rejectWords = settings.autoRejectKeywords
        .split(",")
        .map((w) => w.trim())
        .filter((w) => w);

      const hasRejectWords = rejectWords.some(
        (word) =>
          content.toLowerCase().includes(word.toLowerCase()) ||
          (title && title.toLowerCase().includes(word.toLowerCase())),
      );

      if (hasRejectWords) {
        const result = {
          status: "pending",
          reason: "contains_reject_keywords",
        };
        logger.debug("AuditService: 拒绝关键词触发", { rejectWords, result });
        return result;
      }
    }

    // 3. 检查自动通过关键词
    if (settings.autoApproveKeywords) {
      const approveWords = settings.autoApproveKeywords
        .split(",")
        .map((w) => w.trim())
        .filter((w) => w);

      const hasApproveWords = approveWords.some(
        (word) =>
          content.toLowerCase().includes(word.toLowerCase()) ||
          (title && title.toLowerCase().includes(word.toLowerCase())),
      );

      if (hasApproveWords) {
        const result = { status: "published", reason: "auto_approved" };
        logger.debug("AuditService: 自动通过关键词触发", {
          approveWords,
          result,
        });
        return result;
      }

      // 4. 智能审核模式：未匹配关键词的内容进入审核
      if (settings.enableSmartAudit) {
        const result = { status: "pending", reason: "smart_audit" };
        logger.debug("AuditService: 智能审核触发", { result });
        return result;
      }
    }

    // 默认直接发布
    const result = { status: "published", reason: "default" };
    logger.debug("AuditService: 默认审核结果", { result });
    return result;
  }
}

module.exports = new AuditService();
