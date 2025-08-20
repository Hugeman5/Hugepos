/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
          config.externals.push('@floating-ui/react');
        }
        return config
    },
};

export default nextConfig;
