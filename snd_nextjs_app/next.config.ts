import type { NextConfig } from "next";
import { DefinePlugin } from "webpack";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	env: {
		NEXT_TELEMETRY_DISABLED: "1",
	},
	serverExternalPackages: ["pg"],
	transpilePackages: ["jspdf"],
	async headers() {
		return [
			{
				source: "/api/:path*",
				headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
			},
		];
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.plugins = config.plugins || [];
			config.plugins.push(
				new DefinePlugin({
					self: "globalThis",
					global: "globalThis",
					window: "globalThis",
				})
			);
			config.output = { ...config.output, globalObject: "globalThis" };
		}
		return config;
	},
	compress: true,
	poweredByHeader: false,
	images: {
		formats: ["image/webp", "image/avif"],
		minimumCacheTTL: 60,
	},
};

export default nextConfig;
