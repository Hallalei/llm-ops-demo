FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.3.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

EXPOSE 12138

CMD ["pnpm", "start", "-p", "12138"]
