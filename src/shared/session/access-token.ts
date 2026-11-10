let accessToken: string | null = null
let managementContextId: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setManagementContextId(contextId: string | null) {
  managementContextId = contextId
}

export function getManagementContextId() {
  return managementContextId
}
