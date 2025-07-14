const { Event, User, EventRegistration } = require('../models/associations');
const { Op } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');

/**
 * @desc    获取即将到来的活动列表
 * @route   GET /api/events
 * @access  Public
 */
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    console.log('[活动列表] 接收到请求:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereCondition = {};
    
    // 根据查询参数过滤
    if (req.query.status === 'upcoming') {
      // 未开始的活动
      whereCondition.status = 'upcoming';
    } else if (req.query.status) {
      // 其他指定状态
      whereCondition.status = req.query.status;
    } else {
      // 默认显示未开始和进行中的活动
      whereCondition.status = {
        [Op.in]: ['upcoming', 'ongoing']
      };
      whereCondition.startTime = {
        [Op.gte]: moment().subtract(1, 'days').toDate() // 包括今天和未来的活动
      };
    }
    
    // 按推荐状态过滤
    if (req.query.isRecommended === 'true') {
      whereCondition.isRecommended = true;
      console.log('[活动列表] 查询推荐活动');
    }
    
    console.log('[活动列表] 查询条件:', JSON.stringify(whereCondition));
    
    // 排序方式
    let order = [['startTime', 'ASC']]; // 默认按开始时间升序
    if (req.query.sort === 'participants') {
      order = [['currentParticipants', 'DESC'], ['startTime', 'ASC']]; // 按报名人数降序
    }
    
    // 查询活动列表
    const { count, rows: events } = await Event.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nickname', 'username', 'avatar']
        }
      ],
      order: order,
      limit,
      offset
    });
    
    console.log(`[活动列表] 查询结果: 共找到 ${count} 个活动`);
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('[活动列表] 错误:', error);
    next(error);
  }
};

/**
 * @desc    获取活动详情
 * @route   GET /api/events/:id
 * @access  Public
 */
exports.getEventById = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    // 查询活动详情，包括创建者信息
    const event = await Event.findOne({
      where: {
        id: eventId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nickname', 'username', 'avatar'] 
        }
      ]
    });
    
    // 如果活动不存在
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    参加活动
 * @route   POST /api/events/:id/join
 * @access  Private
 */
exports.joinEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const formData = req.body.formData || {}; // 获取表单数据
    
    console.log(`[活动报名] 开始 - 用户:${userId}, 活动:${eventId}`);
    
    // 查询活动是否存在
    const event = await Event.findByPk(eventId);
    
    // 如果活动不存在
    if (!event) {
      console.log(`[活动报名] 失败 - 活动不存在:${eventId}`);
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 检查活动是否已经结束或取消
    if (event.status === 'past' || event.status === 'canceled') {
      console.log(`[活动报名] 失败 - 活动已结束或取消, 状态:${event.status}`);
      return res.status(400).json({
        success: false,
        message: '该活动已结束或已取消，无法参加'
      });
    }
    
    // 检查是否已经过了报名截止时间
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      console.log(`[活动报名] 失败 - 已过报名截止时间`);
      return res.status(400).json({
        success: false,
        message: '已过报名截止时间，无法报名'
      });
    }
    
    // 检查活动是否人数已满
    if (event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants) {
      console.log(`[活动报名] 失败 - 活动人数已满, 当前:${event.currentParticipants}, 最大:${event.maxParticipants}`);
      return res.status(400).json({
        success: false,
        message: '该活动人数已满，无法参加'
      });
    }
    
    // 检查用户是否已经参加过该活动
    const alreadyJoined = await event.hasParticipant(userId);
    if (alreadyJoined) {
      console.log(`[活动报名] 失败 - 用户已经报名过`);
      return res.status(400).json({
        success: false,
        message: '您已经参加过该活动'
      });
    }
    
    // 验证表单数据
    if (event.registrationFields && event.registrationFields.length > 0) {
      const missingFields = [];
      
      event.registrationFields.forEach(field => {
        // 检查必填字段
        if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
          missingFields.push(field.label || field.name);
        }
      });
      
      if (missingFields.length > 0) {
        console.log(`[活动报名] 失败 - 缺少必填字段: ${missingFields.join(', ')}`);
        return res.status(400).json({
          success: false,
          message: `请填写以下必填项：${missingFields.join('、')}`
        });
      }
    }
    
    // 添加用户到活动参与者
    await event.addParticipant(userId);
    
    // 创建报名记录，保存表单数据
    await EventRegistration.create({
      userId,
      eventId,
      status: 'registered',
      formData: formData
    });
    
    // 更新当前参与人数
    event.currentParticipants += 1;
    await event.save();
    
    console.log(`[活动报名] 成功 - 当前参与人数:${event.currentParticipants}`);
    
    res.status(200).json({
      success: true,
      message: '成功参加活动',
      data: {
        event
      }
    });
  } catch (error) {
    console.error(`[活动报名] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    退出活动
 * @route   POST /api/events/:id/leave
 * @access  Private
 */
exports.leaveEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // 查询活动是否存在
    const event = await Event.findByPk(eventId);
    
    // 如果活动不存在
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 检查活动是否已经结束
    if (event.status === 'past') {
      return res.status(400).json({
        success: false,
        message: '该活动已结束，无法退出'
      });
    }
    
    // 检查用户是否参加过该活动
    const hasJoined = await event.hasParticipant(userId);
    if (!hasJoined) {
      return res.status(400).json({
        success: false,
        message: '您尚未参加该活动'
      });
    }
    
    // 从活动参与者中移除用户
    await event.removeParticipant(userId);
    
    // 更新当前参与人数
    if (event.currentParticipants > 0) {
      event.currentParticipants -= 1;
      await event.save();
    }
    
    res.status(200).json({
      success: true,
      message: '成功退出活动'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    检查用户是否注册了特定活动
 * @route   GET /api/events/:id/registration-status
 * @access  Private
 */
exports.checkRegistrationStatus = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    console.log(`[检查注册状态] 用户:${userId}, 活动:${eventId}`);
    
    // 查询活动是否存在
    const event = await Event.findByPk(eventId);
    
    // 如果活动不存在
    if (!event) {
      console.log(`[检查注册状态] 活动不存在:${eventId}`);
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 检查用户是否注册过该活动 - 使用与joinEvent相同的方法
    const isRegistered = await event.hasParticipant(userId);
    
    const result = {
      success: true,
      data: {
        isRegistered: isRegistered,
        registrationDate: null, // 注意：使用hasParticipant方法无法获取注册日期
        currentParticipants: event.currentParticipants,
        maxParticipants: event.maxParticipants,
        isFull: event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants
      }
    };
    
    console.log(`[检查注册状态] 结果:`, result.data);
    
    res.status(200).json(result);
  } catch (error) {
    console.error(`[检查注册状态] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    批量检查用户是否注册了多个活动
 * @route   POST /api/events/batch-registration-status
 * @access  Private
 */
exports.batchCheckRegistrationStatus = async (req, res, next) => {
  try {
    const { eventIds } = req.body;
    const userId = req.user.id;
    
    console.log(`[批量检查注册状态] 用户:${userId}, 活动:${eventIds}`);
    
    // 验证请求
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的活动ID数组'
      });
    }
    
    // 获取所有指定的活动
    const events = await Event.findAll({
      where: {
        id: eventIds
      }
    });
    
    // 创建结果对象
    const result = {};
    
    // 初始化所有活动ID的结果
    eventIds.forEach(id => {
      result[id] = {
        exists: false,
        isRegistered: false,
        currentParticipants: 0,
        maxParticipants: 0,
        isFull: false
      };
    });
    
    // 检查每个活动的参与状态
    for (const event of events) {
      const eventId = event.id;
      const isRegistered = await event.hasParticipant(userId);
      
      result[eventId] = {
        exists: true,
        isRegistered: isRegistered,
        currentParticipants: event.currentParticipants,
        maxParticipants: event.maxParticipants,
        isFull: event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants
      };
    }
    
    console.log(`[批量检查注册状态] 结果:`, result);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`[批量检查注册状态] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    取消活动报名
 * @route   POST /api/events/:id/cancel
 * @access  Private
 */
exports.cancelRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const cancelReason = req.body.reason || '用户取消报名'; 
    
    console.log(`[取消报名] 开始 - 用户:${userId}, 活动:${eventId}`);
    
    // 查询活动是否存在
    const event = await Event.findByPk(eventId);
    
    // 如果活动不存在
    if (!event) {
      console.log(`[取消报名] 失败 - 活动不存在:${eventId}`);
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 检查活动是否允许取消报名
    if (!event.allowCancelRegistration) {
      console.log(`[取消报名] 失败 - 活动不允许取消报名`);
      return res.status(403).json({
        success: false,
        message: '此活动不允许取消报名'
      });
    }
    
    // 检查活动是否已经结束或取消
    if (event.status === 'past' || event.status === 'canceled') {
      console.log(`[取消报名] 失败 - 活动已结束或取消, 状态:${event.status}`);
      return res.status(400).json({
        success: false,
        message: '活动已结束或已取消，无法取消报名'
      });
    }
    
    // 检查用户是否参加过该活动
    const hasJoined = await event.hasParticipant(userId);
    if (!hasJoined) {
      console.log(`[取消报名] 失败 - 用户未报名此活动`);
      return res.status(400).json({
        success: false,
        message: '您尚未报名此活动'
      });
    }
    
    // 从活动参与者中移除用户
    await event.removeParticipant(userId);
    
    // 更新报名记录状态
    await EventRegistration.update(
      { 
        status: 'cancelled', 
        cancelTime: new Date(),
        cancelReason: cancelReason 
      },
      { 
        where: { 
          userId: userId, 
          eventId: eventId, 
          status: 'registered'
        } 
      }
    );
    
    // 更新当前参与人数
    if (event.currentParticipants > 0) {
      event.currentParticipants -= 1;
      await event.save();
    }
    
    console.log(`[取消报名] 成功 - 当前参与人数:${event.currentParticipants}`);
    
    res.status(200).json({
      success: true,
      message: '成功取消报名'
    });
  } catch (error) {
    console.error(`[取消报名] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    获取活动报名表单配置
 * @route   GET /api/events/:id/form-config
 * @access  Public
 */
exports.getEventFormConfig = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    // 查询活动是否存在
    const event = await Event.findByPk(eventId, {
      attributes: ['id', 'registrationFields', 'allowCancelRegistration', 'registrationDeadline']
    });
    
    // 如果活动不存在
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 是否允许报名（已过截止日期不能报名）
    const nowDate = new Date();
    const isRegistrationOpen = !event.registrationDeadline || nowDate < new Date(event.registrationDeadline);
    
    // 返回表单配置
    res.status(200).json({
      success: true,
      data: {
        registrationFields: event.registrationFields || [],
        allowCancelRegistration: event.allowCancelRegistration,
        registrationDeadline: event.registrationDeadline,
        isRegistrationOpen
      }
    });
  } catch (error) {
    console.error(`[获取表单配置] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    获取活动报名列表
 * @route   GET /api/events/:id/registrations
 * @access  Private (Admin Only)
 */
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // 检查用户权限（只有管理员或活动创建者可以查看）
    if (req.user.role !== 'admin') {
      const event = await Event.findByPk(eventId);
      if (!event || event.creatorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '您没有权限查看此活动的报名列表'
        });
      }
    }
    
    // 查询报名记录
    const { count, rows: registrations } = await EventRegistration.findAndCountAll({
      where: { eventId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'username', 'avatar', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      data: {
        registrations,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error(`[获取报名列表] 错误:`, error);
    next(error);
  }
};

/**
 * @desc    导出活动报名数据
 * @route   GET /api/events/:id/export-registrations
 * @access  Private (Admin Only)
 */
exports.exportEventRegistrations = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    
    // 检查用户权限（只有管理员或活动创建者可以导出）
    if (req.user.role !== 'admin') {
      const event = await Event.findByPk(eventId);
      if (!event || event.creatorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '您没有权限导出此活动的报名数据'
        });
      }
    }
    
    // 查询活动信息和表单字段
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在'
      });
    }
    
    // 查询所有报名记录
    const registrations = await EventRegistration.findAll({
      where: { 
        eventId,
        status: 'registered' // 只导出有效的报名记录
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'username', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });
    
    // 准备CSV数据
    let csvHeaders = ['序号', '用户ID', '用户名', '昵称', '邮箱', '报名时间'];
    
    // 添加自定义表单字段到表头
    const formFields = event.registrationFields || [];
    formFields.forEach(field => {
      csvHeaders.push(field.label || field.name);
    });
    
    // 准备CSV行数据
    let csvRows = [csvHeaders.join(',')];
    
    registrations.forEach((reg, index) => {
      let rowData = [
        index + 1,
        reg.user.id,
        reg.user.username,
        reg.user.nickname,
        reg.user.email || '',
        new Date(reg.createdAt).toLocaleString()
      ];
      
      // 添加表单字段数据
      formFields.forEach(field => {
        const fieldName = field.name;
        const formData = reg.formData || {};
        rowData.push(formData[fieldName] || '');
      });
      
      // 转义CSV中的特殊字符
      rowData = rowData.map(item => {
        if (typeof item !== 'string') return item;
        // 如果字段中包含逗号、引号或换行符，则用引号包裹并转义内部的引号
        if (item.includes(',') || item.includes('"') || item.includes('\n')) {
          return `"${item.replace(/"/g, '""')}"`;
        }
        return item;
      });
      
      csvRows.push(rowData.join(','));
    });
    
    const csvContent = csvRows.join('\r\n');
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(`活动报名数据_${event.title}_${new Date().toISOString().split('T')[0]}.csv`)}`);
    
    // 发送CSV数据
    res.send('\ufeff' + csvContent); // 添加BOM以正确显示中文
  } catch (error) {
    console.error(`[导出报名数据] 错误:`, error);
    next(error);
  }
}; 