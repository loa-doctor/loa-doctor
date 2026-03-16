/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  output: 'export',
}

const isGithubActions = process.env.GITHUB_ACTIONS || false;

if (isGithubActions) {
  const repoName = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || 'loa-doctor';
  nextConfig.assetPrefix = `/${repoName}/`;
  nextConfig.basePath = `/${repoName}`;
}

module.exports = nextConfig
