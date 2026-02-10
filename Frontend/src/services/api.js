import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true
})

export function setAuthToken(token) {
  return token
}

export async function loginRequest(payload) {
  const { data } = await api.post('/api/auth/login', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export async function logoutRequest() {
  const { data } = await api.post('/api/auth/logout')
  return data
}

export async function requestRole(payload, source = 'login') {
  const { data } = await api.post('/api/auth/request-role', payload, {
    headers: { 'X-Request-Source': source }
  })
  return data
}

export async function resetPassword(payload) {
  const { data } = await api.post('/api/auth/reset-password', payload)
  return data
}

export async function changePassword(payload) {
  const { data } = await api.post('/api/auth/change-password', payload)
  return data
}

export async function fetchDashboardSummary(params) {
  const { data } = await api.get('/api/dashboard/summary', { params })
  return data
}

export async function uploadPreview(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/uploads/preview', form)
  return data
}

export async function getUploadPreview(jobId) {
  const { data } = await api.get(`/api/uploads/${jobId}/preview`)
  return data
}

export async function submitUpload(jobId, mapping) {
  const { data } = await api.post(`/api/uploads/${jobId}/submit`, { mapping })
  return data
}

export async function getUploadJob(jobId) {
  const { data } = await api.get(`/api/uploads/${jobId}`)
  return data
}

export async function listReconciliations(params) {
  const { data } = await api.get('/api/reconciliation', { params })
  return data
}

export async function getReconciliationDetail(resultId) {
  const { data } = await api.get(`/api/reconciliation/${resultId}`)
  return data
}

export async function manualReconcile(resultId, payload) {
  const { data } = await api.patch(`/api/reconciliation/${resultId}/manual`, payload)
  return data
}

export async function listAuditTimeline(recordType, recordId) {
  const { data } = await api.get(`/api/audit/timeline/${recordType}/${recordId}`)
  return data
}

export async function listAuditLogs() {
  const { data } = await api.get('/api/audit')
  return data
}

export async function listUsers() {
  const { data } = await api.get('/api/users')
  return data
}

export async function createUser(payload) {
  const { data } = await api.post('/api/users', payload)
  return data
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/api/users/${id}/role`, { role })
  return data
}

export async function listRules() {
  const { data } = await api.get('/api/reconciliation/rules/list')
  return data
}

export async function createRule(payload) {
  const { data } = await api.post('/api/reconciliation/rules', payload)
  return data
}

export async function updateRule(id, payload) {
  const { data } = await api.patch(`/api/reconciliation/rules/${id}`, payload)
  return data
}

export async function updatePartialTolerance(amountVariancePercent) {
  const { data } = await api.patch('/api/reconciliation/rules/partial-tolerance', { amountVariancePercent })
  return data
}

export async function directUpload(file, mapping) {
  const form = new FormData()
  form.append('file', file)
  form.append('mapping', JSON.stringify(mapping))
  const { data } = await api.post('/api/uploads', form)
  return data
}

export async function listAuditLogsPaginated(params) {
  const { data } = await api.get('/api/audit', { params })
  return data
}

export async function listUploadJobs(params) {
  const { data } = await api.get('/api/uploads', { params })
  return data
}

export async function listRejectedRows(jobId, params) {
  const { data } = await api.get(`/api/uploads/${jobId}/rejected-rows`, { params })
  return data
}

export async function getUploadMonitoring(params) {
  const { data } = await api.get('/api/uploads/monitor/summary', { params })
  return data
}

export async function listRoleRequests(params) {
  const { data } = await api.get('/api/role-requests', { params })
  return data
}

export async function updateRoleRequest(id, status) {
  const { data } = await api.patch(`/api/role-requests/${id}`, { status })
  return data
}

export async function exportAuditCsv(params) {
  const response = await api.get('/api/audit/export', { params, responseType: 'blob' })
  return response
}

export default api
