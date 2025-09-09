import apiClient from "./axios";

// Auth Services
export const authServices = {
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/login", { email, password }),

  registerCompany: (data: any) =>
    apiClient.post("/api/auth/register-company", data),

  getMe: () => apiClient.get("/api/auth/me"),

  getCurrentUserPermissions: () => apiClient.get("/api/auth/me/permissions"),

  getCurrentUserModule: () => apiClient.get("/api/auth/me/module"),
};

// Subscription Services
export const subscriptionServices = {
  getPricingConfig: () => apiClient.get("/api/subscription/pricing-config"),

  calculatePrice: (data: any) =>
    apiClient.post("/api/subscription/calculate-price", data),

  createSubscription: (data: any) =>
    apiClient.post("/api/subscription/create", data),

  updatePaymentStatus: (subscriptionId: string, data: any) =>
    apiClient.patch(`/api/subscription/${subscriptionId}/payment-status`, data),

  getCurrentSubscription: () => apiClient.get("/api/subscription/current"),

  getSubscriptionHistory: () => apiClient.get("/api/subscription/history"),

  getCompanySubscriptionInfo: () =>
    apiClient.get("/api/subscription/company-info"),
};

// Master Admin Services
export const masterServices = {
  // Dashboard
  getDashboardStats: () => apiClient.get("/api/master/dashboard"),

  // Companies
  getCompanies: (params?: any) =>
    apiClient.get("/api/master/companies", { params }),

  getCompany: (id: string) => apiClient.get(`/api/master/companies/${id}`),

  updateCompany: (id: string, data: any) =>
    apiClient.put(`/api/master/companies/${id}`, data),

  deleteCompany: (id: string) =>
    apiClient.delete(`/api/master/companies/${id}`),

  toggleCompanyStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/companies/${id}/status`, data),

  // Plans
  getPlans: () => apiClient.get("/api/subscription/pricing-config"),

  createPlan: (data: any) => apiClient.post("/api/master/plans", data),

  updatePlan: (id: string, data: any) =>
    apiClient.put(`/api/master/plans/${id}`, data),

  deletePlan: (id: string) => apiClient.delete(`/api/master/plans/${id}`),

  getDropdowns: (params?: any) =>
    apiClient.get("api/master/dropdowns", { params }),

  getMasterdropdownvalues: (data: any) =>
    apiClient.post("api/master/dropdowns/dropdown_values", data),

  // Permissions
  getPermissions: (params?: any) =>
    apiClient.get("/api/master/permissions", { params }),

  getPermission: (id: string) => apiClient.get(`/api/master/permissions/${id}`),

  createPermission: (data: any) =>
    apiClient.post("/api/master/permissions", data),

  updatePermission: (id: string, data: any) =>
    apiClient.put(`/api/master/permissions/${id}`, data),

  deletePermission: (id: string) =>
    apiClient.delete(`/api/master/permissions/${id}`),

  togglePermissionStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/permissions/${id}/status`, data),

  // Settings
  updateProfile: (data: any) => apiClient.put("/api/master/profile", data),

  updateSmtpSettings: (data: any) =>
    apiClient.put("/api/master/smtp-settings", data),

  testSmtp: (data: any) => apiClient.post("/api/master/test-smtp", data),

  // Payment Settings
  updatePaymentSettings: (data: any) =>
    apiClient.put("/api/master/payment-settings", data),

  getPaymentSettings: () => apiClient.get("/api/master/payment-settings"),

  // Maintenance Settings
  getMaintenanceSettings: () => apiClient.get("/api/master/maintenance"),

  updateMaintenanceSettings: (data: any) =>
    apiClient.put("/api/master/maintenance", data),

  // Public maintenance settings (no auth required)
  getPublicMaintenanceSettings: () => apiClient.get("/api/master/maintenance/public"),
};

export const masterDropdownServices = {
  getMasterDropdowns: (params?: any) =>
    apiClient.get("/api/master/dropdowns", { params }),

  createMasterDropdown: (data: any) =>
    apiClient.post("/api/master/dropdowns", data),

  updateMasterDropdown: (id: string, data: any) =>
    apiClient.put(`/api/master/dropdowns/${id}`, data),

  deleteMasterDropdown: (id: string) =>
    apiClient.delete(`/api/master/dropdowns/${id}`),

  addMasterValue: (dropdownId: string, data: any) =>
    apiClient.post(`/api/master/dropdowns/${dropdownId}/values`, data),

  updateMasterValue: (dropdownId: string, valueId: string, data: any) =>
    apiClient.put(
      `/api/master/dropdowns/${dropdownId}/values/${valueId}`,
      data
    ),

  deleteMasterValue: (dropdownId: string, valueId: string) =>
    apiClient.delete(`/api/master/dropdowns/${dropdownId}/values/${valueId}`),

  reorderMasterValues: (dropdownId: string, data: any) =>
    apiClient.put(`/api/master/dropdowns/${dropdownId}/reorder/values`, data),
};

// Company Services
export const companyServices = {
  // Dashboard
  getDashboardStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/stats", { params }),

  getVehicleStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/vehicles", { params }),

  getInspectionStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/inspections", { params }),

  getAppraisalStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/appraisals", { params }),

  getMasterdropdownvalues: (data: any) =>
    apiClient.post("api/company/company/dropdowns/dropdown_values", data),

  getCompanyMasterdropdownvalues: (data: any) =>
    apiClient.post(
      "api/company/company_dropdowns/dropdowns/dropdown_values",
      data
    ),

  getUserStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/users", { params }),

  getRevenueStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/revenue", { params }),

  getActivityStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/activity", { params }),

  getPerformanceStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/performance", { params }),

  getSystemStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/system", { params }),

  getRecentActivity: (params?: any) =>
    apiClient.get("/api/company/dashboard/recent-activity", { params }),

  // ... keep existing code (users, permissions, settings)

  // Users
  getUsers: (params?: any) => apiClient.get("/api/company/users", { params }),

  createUser: (data: any) => apiClient.post("/api/company/users", data),

  updateUser: (id: string, data: any) =>
    apiClient.put(`/api/company/users/${id}`, data),

  deleteUser: (id: string) => apiClient.delete(`/api/company/users/${id}`),

  toggleUserStatus: (id: string, data: any) =>
    apiClient.patch(`/api/company/users/${id}/status`, data),

  sendWelcomeEmail: (id: string) =>
    apiClient.post(`/api/company/users/${id}/send-welcome`),

  // Permissions
  getAvailablePermissions: () =>
    apiClient.get("/api/company/permissions/available"),

  getUsersWithPermissions: (params?: any) =>
    apiClient.get("/api/company/users-permissions", { params }),

  getUserPermissions: (userId: string) =>
    apiClient.get(`/api/company/users/${userId}/permissions`),

  updateUserPermissions: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/permissions`, data),

  // Module Access
  getUserModules: (userId: string) =>
    apiClient.get(`/api/company/users/${userId}/modules`),

  updateUserModules: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/modules`, data),

  // Settings
  getS3Config: () => apiClient.get("/api/company/settings/s3"),

  updateS3Config: (data: any) =>
    apiClient.put("/api/company/settings/s3", data),

  getCallbackConfig: () => apiClient.get("/api/company/settings/callback"),

  updateCallbackConfig: (data: any) =>
    apiClient.put("/api/company/settings/callback", data),

  getBillingInfo: () => apiClient.get("/api/company/settings/billing"),

  testS3Connection: (data: any) =>
    apiClient.post("/api/company/settings/test-s3", data),

  testWebhook: (data: any) =>
    apiClient.post("/api/company/settings/test-webhook", data),
};

// Dealership Services
export const dealershipServices = {
  getDealerships: (params?: any) =>
    apiClient.get("/api/dealership", { params }),

  getDealership: (id: string) => apiClient.get(`/api/dealership/${id}`),

  createDealership: (data: any) => apiClient.post("/api/dealership", data),

  updateDealership: (id: string, data: any) =>
    apiClient.put(`/api/dealership/${id}`, data),

  deleteDealership: (id: string) => apiClient.delete(`/api/dealership/${id}`),

  toggleDealershipStatus: (id: string, data: any) =>
    apiClient.patch(`/api/dealership/${id}/status`, data),

  getDealershipsDropdown: () => apiClient.get("/api/dealership/dropdown"),
};

// ... keep existing code (other services remain the same)

// Dropdown Services
export const dropdownServices = {
  getDropdowns: (params?: any) => apiClient.get("/api/dropdown", { params }),

  createDropdown: (data: any) => apiClient.post("/api/dropdown", data),

  updateDropdown: (id: string, data: any) =>
    apiClient.put(`/api/dropdown/${id}`, data),

  deleteDropdown: (id: string) => apiClient.delete(`/api/dropdown/${id}`),

  addValue: (dropdownId: string, data: any) =>
    apiClient.post(`/api/dropdown/${dropdownId}/values`, data),

  updateValue: (dropdownId: string, valueId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/values/${valueId}`, data),

  deleteValue: (dropdownId: string, valueId: string) =>
    apiClient.delete(`/api/dropdown/${dropdownId}/values/${valueId}`),

  reorderValues: (dropdownId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/reorder/values`, data),

  getMasterInspection: () => apiClient.get("/api/dropdown/master_inspection"),
};

// Configuration Services
export const configServices = {
  // Inspection Config
  getInspectionConfigs: (params?: any) =>
    apiClient.get("/api/config/inspection", { params }),

  // Get active configurations
  getActiveConfigurations: (companyId: string, vehicleType: string) =>
    apiClient.get(
      `/api/master-inspection/active-configs/${companyId}/${vehicleType}`
    ),

  getInspectionConfigDetails: (id: string) =>
    apiClient.get(`/api/config/inspection/${id}`),

  createInspectionConfig: (data: any) =>
    apiClient.post("/api/config/inspection", data),

  updateInspectionConfig: (id: string, data: any) =>
    apiClient.put(`/api/config/inspection/${id}`, data),

  deleteInspectionConfig: (id: string) =>
    apiClient.delete(`/api/config/inspection/${id}`),

  updateInspectionField: (configId: string, fieldId: string, data: any) =>
    apiClient.put(`/api/config/inspection/${configId}/fields/${fieldId}`, data),

  deleteInspectionField: (configId: string, fieldId: string) =>
    apiClient.delete(`/api/config/inspection/${configId}/fields/${fieldId}`),

  deleteInspectionSection: (configId: string, sectionId: string) =>
    apiClient.delete(
      `/api/config/inspection/${configId}/sections/${sectionId}`
    ),

  updateSectionsOrder: (configId: string, categoryId: string, data: any) =>
    apiClient.put(
      `/api/config/inspection/${configId}/categories/${categoryId}/sections/reorder`,
      data
    ),

  updateFieldsOrder: (configId: string, sectionId: string, data: any) =>
    apiClient.put(
      `/api/config/inspection/${configId}/sections/${sectionId}/fields/reorder`,
      data
    ),

  saveInspectionConfig: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/config/inspection/${id}`, data);
    return response.data;
  },

  // Category services
  addInspectionCategory: (configId: string, categoryData: any) =>
    apiClient.post(
      `/api/config/inspection/${configId}/categories`,
      categoryData
    ),

  addInspectionSection: (configId: string, categoryId: string, data: any) =>
    apiClient.post(
      `/api/config/inspection/${configId}/categories/${categoryId}/sections`,
      data
    ),

  addInspectionField: (configId: string, sectionId: string, data: any) =>
    apiClient.post(
      `/api/config/inspection/${configId}/sections/${sectionId}/fields`,
      data
    ),

  // Trade-in Config
  getTradeinConfigs: (params?: any) =>
    apiClient.get("/api/config/tradein", { params }),

  getTradeinConfigDetails: (id: string) =>
    apiClient.get(`/api/config/tradein/${id}`),

  createTradeinConfig: (data: any) =>
    apiClient.post("/api/config/tradein", data),

  updateTradeinConfig: (id: string, data: any) =>
    apiClient.put(`/api/config/tradein/${id}`, data),

  deleteTradeinConfig: (id: string) =>
    apiClient.delete(`/api/config/tradein/${id}`),

  addTradeinSection: (configId: string, data: any) =>
    apiClient.post(`/api/config/tradein/${configId}/sections`, data),

  addTradeinField: (configId: string, sectionId: string, data: any) =>
    apiClient.post(
      `/api/config/tradein/${configId}/sections/${sectionId}/fields`,
      data
    ),

  updateTradeinField: (configId: string, fieldId: string, data: any) =>
    apiClient.put(
      `/api/config/update/tradein/${configId}/fields/${fieldId}`,
      data
    ),

  deleteTradeinField: (configId: string, fieldId: string) =>
    apiClient.delete(`/api/config/tradein/${configId}/fields/${fieldId}`),

  deleteTradeinSection: (configId: string, sectionId: string) =>
    apiClient.delete(`/api/config/tradein/${configId}/sections/${sectionId}`),

  updateTradeinSectionsOrder: (configId: string, data: any) =>
    apiClient.put(`/api/config/tradein/${configId}/sections/reorder`, data),

  updateTradeinFieldsOrder: (configId: string, sectionId: string, data: any) =>
    apiClient.put(
      `/api/config/tradein/${configId}/sections/${sectionId}/fields/reorder`,
      data
    ),

  updateInspectionCategory: async (
    configId: string,
    categoryId: string,
    categoryData: any
  ) => {
    return await apiClient.put(
      `/api/config/inspection/${configId}/categories/${categoryId}`,
      categoryData
    );
  },

  toggleInspectionCategoryStatus: async (
    configId: string,
    categoryId: string,
    isActive: boolean
  ) => {
    return await apiClient.patch(
      `/api/config/inspection/${configId}/categories/${categoryId}/toggle`,
      { is_active: isActive }
    );
  },

  // Inspection Calculation services
  addInspectionCalculation: async (
    configId: string,
    categoryId: string,
    calculationData: any
  ) => {
    return await apiClient.post(
      `/api/config/inspection/${configId}/categories/${categoryId}/calculations`,
      calculationData
    );
  },

  updateInspectionCalculationFormula: async (
    configId: string,
    categoryId: string,
    calculationId: string,
    formula: any
  ) => {
    return await apiClient.put(
      `/api/config/inspection/${configId}/categories/${categoryId}/calculations/${calculationId}/formula`,
      { formula }
    );
  },

  deleteInspectionCalculation: async (
    configId: string,
    categoryId: string,
    calculationId: string
  ) => {
    return await apiClient.delete(
      `/api/config/inspection/${configId}/categories/${categoryId}/calculations/${calculationId}`
    );
  },

  toggleInspectionCalculationStatus: async (
    configId: string,
    categoryId: string,
    calculationId: string,
    isActive: boolean
  ) => {
    return await apiClient.patch(
      `/api/config/inspection/${configId}/categories/${categoryId}/calculations/${calculationId}/toggle`,
      { is_active: isActive }
    );
  },

  // Trade-in Calculation services
  addTradeinCalculation: async (configId: string, calculationData: any) => {
    return await apiClient.post(
      `/api/config/tradein/${configId}/calculations`,
      calculationData
    );
  },

  updateTradeinCalculationFormula: async (
    configId: string,
    calculationId: string,
    formula: any
  ) => {
    return await apiClient.put(
      `/api/config/tradein/${configId}/calculations/${calculationId}/formula`,
      { formula }
    );
  },

  deleteTradeinCalculation: async (configId: string, calculationId: string) => {
    return await apiClient.delete(
      `/api/config/tradein/${configId}/calculations/${calculationId}`
    );
  },

  toggleTradeinCalculationStatus: async (
    configId: string,
    calculationId: string,
    isActive: boolean
  ) => {
    return await apiClient.patch(
      `/api/config/tradein/${configId}/calculations/${calculationId}/toggle`,
      { is_active: isActive }
    );
  },
  saveTradeinConfig: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/config/tradein/${id}`, data);
    return response.data;
  },

  // S3 Configuration
  getS3Config: () => apiClient.get("/api/company/settings/s3"),
};

// Vehicle Services
export const vehicleServices = {
  getVehicleStock: (params?: any) =>
    apiClient.get("/api/vehicle/stock", { params }),

  getVehicleDetail: (vehicleId: string) =>
    apiClient.get(`/api/vehicle/detail/${vehicleId}`),

  createVehicleStock: (data: any) =>
    apiClient.post("/api/vehicle/create-stock", data),

  bulkImportVehicles: (data: any) =>
    apiClient.post("/api/vehicle/bulk-import", data),

  updateVehicle: (id: string, data: any) =>
    apiClient.put(`/api/vehicle/${id}`, data),

  deleteVehicle: (id: string) => apiClient.delete(`/api/vehicle/${id}`),

  // Vehicle Section Updates
  updateVehicleOverview: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/overview`, data),

  updateVehicleGeneralInfo: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/general-info`, data),

  updateVehicleSource: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/source`, data),

  updateVehicleRegistration: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/registration`, data),

  updateVehicleImport: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/import`, data),

  updateVehicleEngine: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/engine`, data),

  updateVehicleSpecifications: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/specifications`, data),

  updateVehicleSafetyFeatures: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/safety`, data),

  updateVehicleOdometer: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/odometer`, data),

  updateVehicleOwnership: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/ownership`, data),

  // Vehicle Attachments
  getVehicleAttachments: (vehicleId: string) =>
    apiClient.get(`/api/vehicle/${vehicleId}/attachments`),

  uploadVehicleAttachment: (vehicleId: string, data: any) =>
    apiClient.post(`/api/vehicle/${vehicleId}/attachments`, data),

  deleteVehicleAttachment: (vehicleId: string, attachmentId: string) =>
    apiClient.delete(`/api/vehicle/${vehicleId}/attachments/${attachmentId}`),

  // Workshop Status
  updateVehicleWorkshopStatus: (vehicleId: string, data: any) =>
    apiClient.put(`/api/vehicle/${vehicleId}/workshop-status`, data),
};

// Inspection Services
export const inspectionServices = {
  getInspections: (params?: any) =>
    apiClient.get("/api/inspection", { params }),

  startInspection: (vehicleId: string) =>
    apiClient.post(`/api/inspection/start/${vehicleId}`),

  getInspection: (id: string) => apiClient.get(`/api/inspection/${id}`),

  updateInspection: (id: string, data: any) =>
    apiClient.put(`/api/inspection/${id}`, data),

  completeInspection: (id: string, data: any) =>
    apiClient.post(`/api/inspection/${id}/complete`, data),

  getInspectionReport: (id: string) =>
    apiClient.get(`/api/inspection/${id}/report`),
};

// Trade-in Services
export const tradeinServices = {
  getTadeins: (params?: any) => apiClient.get("/api/tradein", { params }),

  startAppraisal: (vehicleId: string) =>
    apiClient.post(`/api/tradein/start/${vehicleId}`),

  getTradein: (id: string) => apiClient.get(`/api/tradein/${id}`),

  updateTradein: (id: string, data: any) =>
    apiClient.put(`/api/tradein/${id}`, data),

  completeAppraisal: (id: string, data: any) =>
    apiClient.post(`/api/tradein/${id}/complete`, data),

  makeOffer: (id: string, data: any) =>
    apiClient.post(`/api/tradein/${id}/offer`, data),

  getTradeinReport: (id: string) => apiClient.get(`/api/tradein/${id}/report`),
};


// Supplier Services
export const supplierServices = {
  getSuppliers: (params?: any) => apiClient.get("/api/supplier", { params }),

  getSupplier: (id: string) => apiClient.get(`/api/supplier/${id}`),

  createSupplier: (data: any) => apiClient.post("/api/supplier", data),

  updateSupplier: (id: string, data: any) =>
    apiClient.put(`/api/supplier/${id}`, data),

  deleteSupplier: (id: string) => apiClient.delete(`/api/supplier/${id}`),

  searchSuppliersByTags: (data: any) =>
    apiClient.post("/api/supplier/search-by-tags", data),
};

// Workshop Services
export const workshopServices = {
  getWorkshopVehicles: (params?: any) =>
    apiClient.get("/api/workshop/vehicles", { params }),

  getWorkshopVehicleDetails: (vehicleId: string, vehicleType: string) =>
    apiClient.get(`/api/workshop/vehicle/${vehicleId}/${vehicleType}`),

  createQuote: (data: any) => apiClient.post("/api/workshop/quote", data),

  getQuotesForField: (
    vehicleType: string,
    vehicleStockId: number,
    fieldId: string
  ) =>
    apiClient.get(
      `/api/workshop/quotes/${vehicleType}/${vehicleStockId}/${fieldId}`
    ),

  approveSupplierQuote: (quoteId: string, supplierId: string) =>
    apiClient.post(`/api/workshop/quote/${quoteId}/approve/${supplierId}`),

  acceptWork: (quoteId: string) =>
    apiClient.post(`/api/workshop/quote/${quoteId}/accept-work`),

  requestRework: (quoteId: string, reason: string) =>
    apiClient.post(`/api/workshop/quote/${quoteId}/request-rework`, { reason }),

  // Workshop field management
  addWorkshopField: (data: any) =>
    apiClient.post("/api/config/workshop/field", data),

  updateWorkshopField: (fieldId: string, data: any) =>
    apiClient.put(`/api/config/workshop/field/${fieldId}`, data),

  checkWorkshopCompletion: (vehicleId: string, vehicleType: string) =>
    apiClient.get(
      `/api/workshop-report/vehicle/${vehicleId}/${vehicleType}/check-completion`
    ),

  completeWorkshop: (vehicleId: string, vehicleType: string, data: any) =>
    apiClient.post(
      `/api/workshop-report/vehicle/${vehicleId}/${vehicleType}/complete`,
      data
    ),

  getWorkshopReports: (vehicleId: string, vehicleType: string, params?: any) =>
    apiClient.get(`/api/workshop-report/vehicle/${vehicleId}/${vehicleType}`, {
      params,
    }),

  getWorkshopReport: (reportId: string) =>
    apiClient.get(`/api/workshop-report/report/${reportId}`),
};

// Supplier Auth Services
export const supplierAuthServices = {
  login: (email: string, password: string) =>
    apiClient.post("/api/supplier-auth/login", { email, password }),

  getProfile: () => apiClient.get("/api/supplier-auth/profile"),

  getVehicles: () => apiClient.get("/api/supplier-auth/vehicles"),

  getVehicleDetails: (vehicleStockId: string, vehicleType: string) =>
    apiClient.get(
      `/api/supplier-auth/vehicle/${vehicleStockId}/${vehicleType}`
    ),

  submitResponse: (quoteId: string, data: any) =>
    apiClient.post(`/api/supplier-auth/quote/${quoteId}/respond`, data),

  markNotInterested: (quoteId: string) =>
    apiClient.patch(`/api/supplier-auth/quote/${quoteId}/not-interested`),
};

// Supplier Dashboard Services
export const supplierDashboardServices = {
  getStats: () => apiClient.get("/api/supplier-dashboard/stats"),

  getsupplierS3Config: () =>
    apiClient.get("/api/supplier-dashboard/supplier_s3"),

  getQuotesByStatus: (status: string, params?: any) =>
    apiClient.get(`/api/supplier-dashboard/quotes/${status}`, { params }),

  startWork: (quoteId: string) =>
    apiClient.post(`/api/supplier-dashboard/quote/${quoteId}/start-work`),

  submitWork: (quoteId: string, data: any) =>
    apiClient.post(
      `/api/supplier-dashboard/quote/${quoteId}/submit-work`,
      data
    ),

  updateProfile: (data: any) =>
    apiClient.put("/api/supplier-dashboard/profile", data),
};

export const masterInspectionServices = {
  // Get configuration with optional vehicle stock id for last used config
  getMasterConfiguration: (
    companyId: string,
    vehicleType: string,
    vehicleStockId?: string,
    configId?: string
  ) => {
    const params = new URLSearchParams();
    if (vehicleStockId) params.append("vehicle_stock_id", vehicleStockId);
    if (configId) params.append("configId", configId);

    const queryString = params.toString();
    const url = `/api/master-inspection/config/${companyId}/${vehicleType}${
      queryString ? `?${queryString}` : ""
    }`;

    return apiClient.get(url);
  },

  getActiveConfigurations: (companyId: string, vehicleType: string) =>
    apiClient.get(
      `/api/master-inspection/active-configs/${companyId}/${vehicleType}`
    ),

  getVehicleInspectionData: (
    companyId: string,
    vehicleStockId: string,
    vehicleType: string
  ) =>
    apiClient.get(
      `/api/master-inspection/view/${companyId}/${vehicleStockId}/${vehicleType}`
    ),

  saveInspectionData: (
    companyId: string,
    vehicleStockId: string,
    vehicleType: string,
    data: any
  ) =>
    apiClient.post(
      `/api/master-inspection/save/${companyId}/${vehicleStockId}/${vehicleType}`,
      data
    ),
};

// Add these to your services.ts file in the logServices section
export const logServices = {
  // Get logs with optimized parameters and caching
  getLogs: (queryString: string) => 
    apiClient.get(`/api/logs?${queryString}`, {
      timeout: 30000, // 30 second timeout
    }),

  // Get analytics with caching and timeout
  getLogAnalytics: (queryString: string) => 
    apiClient.get(`/api/logs/analytics?${queryString}`, {
      timeout: 45000, // 45 second timeout for analytics
    }),

  // Cached user and company lookups
  getLogUsers: (params?: any) => 
    apiClient.get("/api/logs/users", { 
      params,
      timeout: 10000,
    }),

  getLogCompanies: (params?: any) => 
    apiClient.get("/api/logs/companies", { 
      params,
      timeout: 10000,
    }),

  // Export with longer timeout and blob response
  exportLogs: (queryString: string) => 
    apiClient.get(`/api/logs/export?${queryString}`, {
      responseType: 'blob',
      timeout: 300000, // 5 minute timeout for exports
      headers: {
        'Accept': 'text/csv',
      },
    }),

  // Get single log by ID
  getLogById: (id: string) => 
    apiClient.get(`/api/logs/${id}`, {
      timeout: 10000,
    }),
};

export default {
  auth: authServices,
  subscription: subscriptionServices,
  master: masterServices,
  company: companyServices,
  dealership: dealershipServices,
  dropdown: dropdownServices,
  masterDropdown: masterDropdownServices,
  config: configServices,
  vehicle: vehicleServices,
  inspection: inspectionServices,
  tradein: tradeinServices,
  logs: logServices,
  supplier: supplierServices,
  workshop: workshopServices,
  supplierAuth: supplierAuthServices,
  supplierDashboard: supplierDashboardServices,
  masterInspectionServices: masterInspectionServices,
};
