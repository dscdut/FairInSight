const config = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  aiBaseUrl: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001/api/v1',
  chatGatewayEnabled: import.meta.env.VITE_CHAT_GATEWAY_ENABLED !== 'false',
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drx34env0',
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'laws_preset',
  maxSizeUploadAvatar: 1048576
}

export default config
