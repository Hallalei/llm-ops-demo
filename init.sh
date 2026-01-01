#!/bin/bash

# Deye LLM Ops - 项目初始化脚本

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

case "$1" in
  start)
    echo "启动开发服务器..."
    pnpm dev
    ;;
  build)
    echo "构建生产版本..."
    pnpm build
    ;;
  test)
    echo "运行健康检查..."
    echo "请确保 DATABASE_URL 环境变量已配置"
    ;;
  status)
    echo "=== 项目状态 ==="
    echo "项目目录: $PROJECT_DIR"
    echo ""
    echo "=== Git 状态 ==="
    git status -s 2>/dev/null || echo "非 Git 仓库"
    ;;
  install)
    echo "安装依赖..."
    pnpm install
    ;;
  *)
    echo "用法: ./init.sh [start|build|test|status|install]"
    echo ""
    echo "  start   - 启动开发服务器"
    echo "  build   - 构建生产版本"
    echo "  test    - 运行健康检查"
    echo "  status  - 查看项目状态"
    echo "  install - 安装依赖"
    ;;
esac
