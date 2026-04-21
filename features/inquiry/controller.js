import {
  getAllInquiries,
  getInquiryById,
  getInquiriesByStatus,
  saveInquiry,
  updateInquiryStatus,
  updateInquiry,
  deleteInquiry,
  getStatistics
} from './service.js';

export async function inquiryListController(req) {
  try {
    const { status, limit = 100 } = req;
    
    let inquiries = status ? getInquiriesByStatus(status) : getAllInquiries();
    inquiries = inquiries.slice(0, limit);
    
    return {
      success: true,
      data: {
        inquiries,
        total: inquiries.length,
        statistics: getStatistics()
      }
    };
  } catch (err) {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message }
    };
  }
}

export async function inquiryGetController(req) {
  const { id } = req;
  
  if (!id) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID不能为空' }
    };
  }

  const inquiry = getInquiryById(id);
  
  if (!inquiry) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '询价不存在' }
    };
  }

  return {
    success: true,
    data: inquiry
  };
}

export async function inquirySaveController(req) {
  try {
    const inquiry = req;
    
    if (!inquiry.userName || !inquiry.contact) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '用户名和联系方式不能为空' }
      };
    }

    const saved = saveInquiry(inquiry);
    
    return {
      success: true,
      data: saved
    };
  } catch (err) {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message }
    };
  }
}

export async function inquiryUpdateStatusController(req) {
  const { id, status } = req;
  
  if (!id || !status) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID和状态不能为空' }
    };
  }

  const validStatuses = ['new', 'contacted', 'dealed'];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '无效的状态' }
    };
  }

  const updated = updateInquiryStatus(id, status);
  
  if (!updated) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '询价不存在' }
    };
  }

  return {
    success: true,
    data: updated
  };
}

export async function inquiryUpdateController(req) {
  const { id, ...changes } = req;
  
  if (!id) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID不能为空' }
    };
  }

  const updated = updateInquiry(id, changes);
  
  if (!updated) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '询价不存在' }
    };
  }

  return {
    success: true,
    data: updated
  };
}

export async function inquiryDeleteController(req) {
  const { id } = req;
  
  if (!id) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID不能为空' }
    };
  }

  const deleted = deleteInquiry(id);
  
  if (!deleted) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '询价不存在' }
    };
  }

  return {
    success: true,
    data: { message: '删除成功' }
  };
}

export async function inquiryStatisticsController(req) {
  return {
    success: true,
    data: getStatistics()
  };
}
