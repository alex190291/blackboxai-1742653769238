// /static/npm/managers/TokenManager.js

import {
  makeRequest
 }
 from "../NPMUtils.js";
import { showSuccess, showError } from "../notificationHelper.js";

export async function refreshToken() {
  try {
    await makeRequest("/npm/api", "/tokens/refresh", "POST");
    showSuccess(window.t("Token refreshed"));
  } catch (error) {
    showError(window.t("Failed to refresh token"));
  }
}

export async function requestToken(identity, secret, scope) {
  try {
    const body = { identity, secret };
    if (scope) body.scope = scope;
    const tokenData = await makeRequest("/npm/api", "/tokens", "POST", body);
    showSuccess(window.t("Token requested successfully"));
    return tokenData;
  } catch (error) {
    showError(window.t("Failed to request token"));
  }
}
