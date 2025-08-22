
import apiClient from './axios';

// Auth Services
export const authServices = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  
  registerCompany: (data: any) =>
    apiClient.post('/api/auth/register-company', data),
  
  getMe: () =>
    apiClient.get('/api/auth/me')
};

// Master Admin Services
export const masterServices = {
  // Dashboard
  getDashboardStats: () =>
    apiClient.get('/api/master/dashboard'),
  
  // Companies
  getCompanies: (params?: any) =>
    apiClient.get('/api/master/companies', { params }),
  
  getCompany: (id: string) =>
    apiClient.get(`/api/master/companies/${id}`),
  
  updateCompany: (id: string, data: any) =>
    apiClient.put(`/api/master/companies/${id}`, data),
  
  deleteCompany: (id: string) =>
    apiClient.delete(`/api/master/companies/${id}`),
  
  toggleCompanyStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/companies/${id}/status`, data),
  
  // Plans
  getPlans: () =>
    apiClient.get('/api/master/plans'),
  
  createPlan: (data: any) =>
    apiClient.post('/api/master/plans', data),
  
  updatePlan: (id: string, data: any) =>
    apiClient.put(`/api/master/plans/${id}`, data),
  
  deletePlan: (id: string) =>
    apiClient.delete(`/api/master/plans/${id}`),
  
  // Permissions
  getPermissions: (params?: any) =>
    apiClient.get('/api/master/permissions', { params }),
  
  getPermission: (id: string) =>
    apiClient.get(`/api/master/permissions/${id}`),
  
  createPermission: (data: any) =>
    apiClient.post('/api/master/permissions', data),
  
  updatePermission: (id: string, data: any) =>
    apiClient.put(`/api/master/permissions/${id}`, data),
  
  deletePermission: (id: string) =>
    apiClient.delete(`/api/master/permissions/${id}`),
  
  togglePermissionStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/permissions/${id}/status`, data),
  
  // Settings
  updateProfile: (data: any) =>
    apiClient.put('/api/master/profile', data),
  
  updateSmtpSettings: (data: any) =>
    apiClient.put('/api/master/smtp-settings', data),
  
  testSmtp: (data: any) =>
    apiClient.post('/api/master/test-smtp', data)
};

// Company Services
export const companyServices = {
  // Dashboard
  getDashboardStats: () =>
    apiClient.get('/api/company/dashboard'),
  
  // Users
  getUsers: (params?: any) =>
    apiClient.get('/api/company/users', { params }),
  
  createUser: (data: any) =>
    apiClient.post('/api/company/users', data),
  
  updateUser: (id: string, data: any) =>
    apiClient.put(`/api/company/users/${id}`, data),
  
  deleteUser: (id: string) =>
    apiClient.delete(`/api/company/users/${id}`),
  
  toggleUserStatus: (id: string, data: any) =>
    apiClient.patch(`/api/company/users/${id}/status`, data),
  
  sendWelcomeEmail: (id: string) =>
    apiClient.post(`/api/company/users/${id}/send-welcome`),
  
  // Permissions
  getAvailablePermissions: () =>
    apiClient.get('/api/company/permissions/available'),
  
  getUsersWithPermissions: (params?: any) =>
    apiClient.get('/api/company/users-permissions', { params }),
  
  getUserPermissions: (userId: string) =>
    apiClient.get(`/api/company/users/${userId}/permissions`),
  
  updateUserPermissions: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/permissions`, data),
  
  // Settings
  updateS3Config: (data: any) =>
    apiClient.put('/api/company/settings/s3', data),
  
  updateCallbackConfig: (data: any) =>
    apiClient.put('/api/company/settings/callback', data),
  
  testS3Connection: (data: any) =>
    apiClient.post('/api/company/settings/test-s3', data),
  
  testWebhook: (data: any) =>
    apiClient.post('/api/company/settings/test-webhook', data)
};

// Dropdown Services
export const dropdownServices = {
  getDropdowns: (params?: any) =>
    apiClient.get('/api/dropdown', { params }),
  
  createDropdown: (data: any) =>
    apiClient.post('/api/dropdown', data),
  
  updateDropdown: (id: string, data: any) =>
    apiClient.put(`/api/dropdown/${id}`, data),
  
  deleteDropdown: (id: string) =>
    apiClient.delete(`/api/dropdown/${id}`),
  
  addValue: (dropdownId: string, data: any) =>
    apiClient.post(`/api/dropdown/${dropdownId}/values`, data),
  
  updateValue: (dropdownId: string, valueId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/values/${valueId}`, data),
  
  deleteValue: (dropdownId: string, valueId: string) =>
    apiClient.delete(`/api/dropdown/${dropdownId}/values/${valueId}`),
  
  reorderValues: (dropdownId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/reorder/values`, data),
  
  getMasterInspection: () =>
    apiClient.get('/api/dropdown/master_inspection')
};

// Configuration Services
export const configServices = {
  // Inspection Config
  getInspectionConfigs: (params?: any) =>
    apiClient.get('/api/config/inspection', { params }),
  
  getInspectionConfigDetails: (id: string) =>
    apiClient.get(`/api/config/inspection/${id}`),
  
  createInspectionConfig: (data: any) =>
    apiClient.post('/api/config/inspection', data),
  
  updateInspectionConfig: (id: string, data: any) =>
    apiClient.put(`/api/config/inspection/${id}`, data),
  
  deleteInspectionConfig: (id: string) =>
    apiClient.delete(`/api/config/inspection/${id}`),

  updateInspectionField: (configId: string, fieldId: string, data: any) =>
    apiClient.put(`/api/config/inspection/${configId}/fields/${fieldId}`, data),
    
  deleteInspectionField: (configId: string, fieldId: string) =>
    apiClient.delete(`/api/config/inspection/${configId}/fields/${fieldId}`),

  deleteInspectionSection: (configId: string, sectionId: string) =>
    apiClient.delete(`/api/config/inspection/${configId}/sections/${sectionId}`),

  updateSectionsOrder: (configId: string, categoryId: string, data: any) =>
    apiClient.put(`/api/config/inspection/${configId}/categories/${categoryId}/sections/reorder`, data),

  updateFieldsOrder: (configId: string, sectionId: string, data: any) =>
    apiClient.put(`/api/config/inspection/${configId}/sections/${sectionId}/fields/reorder`, data),

  saveInspectionConfig: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/config/inspection/${id}`, data);
    return response.data;
  },
  
  // Category services
  addInspectionCategory: (configId: string, categoryData: any) =>
    apiClient.post(`/api/config/inspection/${configId}/categories`, categoryData),

  addInspectionSection: (configId: string, categoryId: string, data: any) =>
    apiClient.post(`/api/config/inspection/${configId}/categories/${categoryId}/sections`, data),
  
  addInspectionField: (configId: string, sectionId: string, data: any) =>
    apiClient.post(`/api/config/inspection/${configId}/sections/${sectionId}/fields`, data),
  
  // Trade-in Config
  getTradeinConfigs: (params?: any) =>
    apiClient.get('/api/config/tradein', { params }),
  
  getTradeinConfigDetails: (id: string) =>
    apiClient.get(`/api/config/tradein/${id}`),
  
  createTradeinConfig: (data: any) =>
    apiClient.post('/api/config/tradein', data),
  
  updateTradeinConfig: (id: string, data: any) =>
    apiClient.put(`/api/config/tradein/${id}`, data),
  
  deleteTradeinConfig: (id: string) =>
    apiClient.delete(`/api/config/tradein/${id}`),
  
  addTradeinSection: (configId: string, data: any) =>
    apiClient.post(`/api/config/tradein/${configId}/sections`, data),
  
  addTradeinField: (configId: string, sectionId: string, data: any) =>
    apiClient.post(`/api/config/tradein/${configId}/sections/${sectionId}/fields`, data),

  updateTradeinField: (configId: string, fieldId: string, data: any) =>
    apiClient.put(`/api/config/update/tradein/${configId}/fields/${fieldId}`, data),
    
  deleteTradeinField: (configId: string, fieldId: string) =>
    apiClient.delete(`/api/config/tradein/${configId}/fields/${fieldId}`),

  deleteTradeinSection: (configId: string, sectionId: string) =>
    apiClient.delete(`/api/config/tradein/${configId}/sections/${sectionId}`),

  updateTradeinSectionsOrder: (configId: string, data: any) =>
    apiClient.put(`/api/config/tradein/${configId}/sections/reorder`, data),

  updateTradeinFieldsOrder: (configId: string, sectionId: string, data: any) =>
    apiClient.put(`/api/config/tradein/${configId}/sections/${sectionId}/fields/reorder`, data),

  saveTradeinConfig: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/config/tradein/${id}`, data);
    return response.data;
  }
};

// Vehicle Services
export const vehicleServices = {
  getVehicleStock: (params?: any) =>
    apiClient.get('/api/vehicle/stock', { params }),
  
  getVehicleDetail: (vehicleId: string) =>
    apiClient.get(`/api/vehicle/detail/${vehicleId}`),
  
  bulkImportVehicles: (data: any) =>
    apiClient.post('/api/vehicle/bulk-import', data),
  
  updateVehicle: (id: string, data: any) =>
    apiClient.put(`/api/vehicle/${id}`, data),
  
  deleteVehicle: (id: string) =>
    apiClient.delete(`/api/vehicle/${id}`)
};

// Inspection Services
export const inspectionServices = {
  getInspections: (params?: any) =>
    apiClient.get('/api/inspection', { params }),
  
  startInspection: (vehicleId: string) =>
    apiClient.post(`/api/inspection/start/${vehicleId}`),
  
  getInspection: (id: string) =>
    apiClient.get(`/api/inspection/${id}`),
  
  updateInspection: (id: string, data: any) =>
    apiClient.put(`/api/inspection/${id}`, data),
  
  completeInspection: (id: string, data: any) =>
    apiClient.post(`/api/inspection/${id}/complete`, data),
  
  getInspectionReport: (id: string) =>
    apiClient.get(`/api/inspection/${id}/report`)
};

// Trade-in Services
export const tradeinServices = {
  getTadeins: (params?: any) =>
    apiClient.get('/api/tradein', { params }),
  
  startAppraisal: (vehicleId: string) =>
    apiClient.post(`/api/tradein/start/${vehicleId}`),
  
  getTradein: (id: string) =>
    apiClient.get(`/api/tradein/${id}`),
  
  updateTradein: (id: string, data: any) =>
    apiClient.put(`/api/tradein/${id}`, data),
  
  completeAppraisal: (id: string, data: any) =>
    apiClient.post(`/api/tradein/${id}/complete`, data),
  
  makeOffer: (id: string, data: any) =>
    apiClient.post(`/api/tradein/${id}/offer`, data),
  
  getTradeinReport: (id: string) =>
    apiClient.get(`/api/tradein/${id}/report`)
};

// Logs Services
export const logServices = {
  getLogs: (params?: any) =>
    apiClient.get('/api/logs', { params }),
  
  getLogAnalytics: (params?: any) =>
    apiClient.get('/api/logs/analytics', { params })
};

export default {
  auth: authServices,
  master: masterServices,
  company: companyServices,
  dropdown: dropdownServices,
  config: configServices,
  vehicle: vehicleServices,
  inspection: inspectionServices,
  tradein: tradeinServices,
  logs: logServices
};
