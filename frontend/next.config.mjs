/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server external packages so that native node modules or MCP transport run smoothly on the server side
  serverExternalPackages: ['@ai-sdk/mcp', '@ai-sdk/google'],
}

export default nextConfig
