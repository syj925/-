// 活动管理相关控制器
const { Event, EventRegistration, User } = require('../models/associations');

// 获取活动详情
exports.getEventDetail = async (req, res) => {
  try {
    console.log('收到获取活动详情请求, 活动ID:', req.params.id);
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      console.log('活动不存在, ID:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: '活动不存在' 
      });
    }
    
    console.log('活动数据获取成功, 活动标题:', event.title);
    // 返回标准格式响应
    res.json({
      success: true,
      data: event,
      message: '获取活动详情成功'
    });
  } catch (err) {
    console.error('获取活动详情出错:', err);
    res.status(500).json({ 
      success: false,
      message: '获取活动详情失败',
      error: err.message 
    });
  }
};

// 获取活动报名列表
exports.getEventRegistrations = async (req, res) => {
  try {
    console.log('收到获取活动报名列表请求, 活动ID:', req.params.id, '参数:', req.query);
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await EventRegistration.findAndCountAll({
      where: { eventId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'username', 'avatar', 'email'] }],
      offset: Number(offset),
      limit: Number(limit),
      order: [['created_at', 'DESC']]
    });
    
    console.log('活动报名数据获取成功, 总数:', count, '当前页数据:', rows.length);
    
    // 返回标准格式响应
    res.json({
      success: true,
      data: {
        registrations: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit)
        }
      },
      message: '获取活动报名列表成功'
    });
  } catch (err) {
    console.error('获取活动报名列表出错:', err);
    res.status(500).json({ 
      success: false,
      message: '获取报名列表失败', 
      error: err.message 
    });
  }
};

// 更新报名状态
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;
    console.log('收到更新报名状态请求, 报名ID:', registrationId, '新状态:', status);
    
    const reg = await EventRegistration.findByPk(registrationId);
    if (!reg) {
      console.log('报名记录不存在, ID:', registrationId);
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }
    
    reg.status = status;
    await reg.save();
    console.log('报名状态已更新为:', status);
    
    res.json({
      success: true,
      data: reg,
      message: '更新报名状态成功'
    });
  } catch (err) {
    console.error('更新报名状态出错:', err);
    res.status(500).json({
      success: false,
      message: '更新报名状态失败',
      error: err.message
    });
  }
};

// 批量更新报名状态
exports.batchUpdateRegistrationStatus = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { registrationIds, status } = req.body;
    
    console.log('收到批量更新报名状态请求, 活动ID:', eventId, '报名IDs:', registrationIds, '新状态:', status);
    
    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要更新的报名记录'
      });
    }
    
    // 有效的状态值
    const validStatuses = ['registered', 'pending', 'confirmed', 'rejected', 'cancelled', 'attended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    // 批量更新
    const result = await EventRegistration.update(
      { status },
      { 
        where: { 
          id: registrationIds,
          eventId: eventId 
        }
      }
    );
    
    console.log('批量更新报名状态完成, 更新记录数:', result[0]);
    
    res.json({
      success: true,
      data: { updatedCount: result[0] },
      message: `成功更新 ${result[0]} 条报名记录的状态`
    });
  } catch (err) {
    console.error('批量更新报名状态出错:', err);
    res.status(500).json({
      success: false,
      message: '批量更新状态失败',
      error: err.message
    });
  }
};

// 导出报名数据（使用ExcelJS）
exports.exportRegistrations = async (req, res) => {
  try {
    console.log('收到导出活动报名数据请求, 活动ID:', req.params.id);
    const Excel = require('exceljs');
    
    // 获取要导出的字段选择
    const { baseFields = '', formFields = '' } = req.query;
    console.log('选择的基本字段:', baseFields);
    console.log('选择的表单字段:', formFields);
    
    // 解析选择的字段
    const selectedBaseFields = baseFields ? baseFields.split(',') : [];
    const selectedFormFields = formFields ? formFields.split(',') : [];
    
    console.log('解析后的基本字段:', selectedBaseFields);
    console.log('解析后的表单字段:', selectedFormFields);
    
    // 如果两种字段都没有选择，返回错误
    if (selectedBaseFields.length === 0 && selectedFormFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少选择一个导出字段'
      });
    }
    
    // 获取报名数据
    const regs = await EventRegistration.findAll({
      where: { eventId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'username'] }],
      order: [['created_at', 'DESC']]
    });
    
    console.log('找到报名数据总数:', regs.length);
    
    // 准备列定义
    const columns = [];
    
    // 添加基础字段（根据选择）
    if (selectedBaseFields.includes('id')) {
      columns.push({ header: 'ID', key: 'id', width: 10 });
    }
    
    if (selectedBaseFields.includes('username')) {
      columns.push({ header: '账号', key: 'username', width: 15 });
    }
    
    if (selectedBaseFields.includes('nickname')) {
      columns.push({ header: '昵称', key: 'nickname', width: 15 });
    }
    
    if (selectedBaseFields.includes('registerTime')) {
      columns.push({ header: '报名时间', key: 'registerTime', width: 20 });
    }
    
    if (selectedBaseFields.includes('status')) {
      columns.push({ header: '状态', key: 'status', width: 12 });
    }
    
    // 添加表单字段列（根据选择）
    Array.from(selectedFormFields).forEach(field => {
      columns.push({
        header: field,
        key: `form_${field}`,
        width: 15
      });
    });
    
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('报名信息');
    
    worksheet.columns = columns;
    
    // 设置表头样式 - 居中对齐
    worksheet.getRow(1).eachCell((cell) => {
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };
      cell.font = { bold: true };
    });
    
    // 添加数据
    regs.forEach(r => {
      // 使用registeredAt或createdAt作为报名时间
      let dateValue = r.createdAt || r.created_at || null;
      
      // 格式化时间
      const formattedDate = dateValue ? new Date(dateValue).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
      
      // 创建行数据对象（仅包含选中的字段）
      const rowData = {};
      
      if (selectedBaseFields.includes('id')) {
        rowData.id = r.id;
      }
      
      if (selectedBaseFields.includes('username')) {
        rowData.username = r.user?.username || '';
      }
      
      if (selectedBaseFields.includes('nickname')) {
        rowData.nickname = r.user?.nickname || '';
      }
      
      if (selectedBaseFields.includes('registerTime')) {
        rowData.registerTime = formattedDate;
      }
      
      if (selectedBaseFields.includes('status')) {
        // 状态映射为中文
        const statusMap = {
          'pending': '待审核',
          'confirmed': '已确认',
          'rejected': '已拒绝',
          'cancelled': '已取消',
          'registered': '已报名',
          'attended': '已参加'
        };
        rowData.status = statusMap[r.status] || r.status;
      }
      
      // 添加表单数据（仅包含选中的字段）
      if (r.formData && typeof r.formData === 'object') {
        Array.from(selectedFormFields).forEach(field => {
          rowData[`form_${field}`] = r.formData[field] || '';
        });
      }
      
      worksheet.addRow(rowData);
    });
    
    // 设置所有数据行单元格样式 - 居中对齐
    for (let i = 2; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).eachCell((cell) => {
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center' 
        };
      });
    }
    
    // 自动调整列宽以适应内容
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.xlsx');
    
    // 将工作簿写入响应
    await workbook.xlsx.write(res);
    console.log('报名数据导出完成');
    res.end();
  } catch (err) {
    console.error('导出报名数据出错:', err);
    res.status(500).json({
      success: false,
      message: '导出失败',
      error: err.message
    });
  }
}; 