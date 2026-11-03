// Deploy as a Post Login Action and set TASKFLOW_API_AUDIENCE in its configuration.
exports.onExecutePostLogin = async (event, api) => {
  if (!event.secrets.TASKFLOW_API_AUDIENCE || event.resource_server?.identifier !== event.secrets.TASKFLOW_API_AUDIENCE) return;
  const namespace = 'https://taskflow.sachadev.me/claims';
  api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email || '');
  api.accessToken.setCustomClaim(`${namespace}/email_verified`, event.user.email_verified === true);
};
