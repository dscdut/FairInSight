const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

const config = {
  baseUrl: apiBaseUrl,
  aiBaseUrl: `${apiBaseUrl}/ai`,
  legalCorpusBaseUrl: `${apiBaseUrl}/legal-corpus`,
  chatGatewayEnabled: import.meta.env.VITE_CHAT_GATEWAY_ENABLED !== 'false',
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drx34env0',
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'laws_preset',
  maxSizeUploadAvatar: 1048576
}

export default config
