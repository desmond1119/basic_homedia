# Login RPC Error Fix - 2025-10-06

## 问题
用户无法登录，出现 RPC 400 错误和 "Database error granting user" 消息。

## 根本原因
1. SQL 迁移后 `app_users` 表缺少 `auth_id` 列
2. 代码仍在使用不存在的 `user_profiles` 视图
3. 触发器可能导致递归或权限问题

## 修复方案

### 1. SQL 迁移 (002_fix_auth_login.sql)
```sql
-- 添加 auth_id 列
ALTER TABLE app_users ADD COLUMN auth_id UUID UNIQUE;

-- 添加缺失的列
ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE app_users ADD COLUMN phone TEXT;
ALTER TABLE app_users ADD COLUMN location TEXT;
ALTER TABLE app_users ADD COLUMN website TEXT;
ALTER TABLE app_users ADD COLUMN company_name TEXT;

-- 创建安全的触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, email, username, email_verified, role)
  VALUES (NEW.id, NEW.email, ..., ...)
  ON CONFLICT (auth_id) DO UPDATE SET ...;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新现有用户的 auth_id
UPDATE app_users SET auth_id = (
  SELECT id FROM auth.users WHERE auth.users.email = app_users.email LIMIT 1
) WHERE auth_id IS NULL;
```

### 2. AuthRepository 修复
- 使用 `app_users` 表替代 `user_profiles` 视图
- 通过 `auth_id` 查询而不是 `id`
- 处理重复键错误 (23505) 为成功情况
- 简化登录逻辑，移除重试循环

## 执行步骤

### 1. 应用 SQL 迁移
```bash
# Supabase Dashboard
# SQL Editor → 运行 supabase/migrations/002_fix_auth_login.sql
```

### 2. 重启开发服务器
```bash
npm run dev
```

### 3. 测试登录
访问 http://localhost:3001 并尝试登录

## 验证
- ✅ 登录成功无 RPC 错误
- ✅ 用户资料正确加载
- ✅ 个人资料页面可访问
- ✅ 控制台无 400 错误

## Git 提交
```
5995725 - fix: resolve login RPC errors after SQL migration
```
