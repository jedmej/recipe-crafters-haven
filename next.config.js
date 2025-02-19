module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://110602490-stable-diffusion-xl.fal.ai/:path*',
      },
    ]
  },
} 