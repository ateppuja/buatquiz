/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "exceljs", "mammoth", "docx"],
  },
};

export default nextConfig;
