# 🎯 论坛系统完整设置指南

## 📋 目录

1. [系统概述](#系统概述)
2. [数据库设置](#数据库设置)
3. [Supabase Storage 配置](#supabase-storage-配置)
4. [Realtime 配置](#realtime-配置)
5. [测试流程](#测试流程)
6. [功能列表](#功能列表)

---

## 系统概述

### ✨ 核心功能

**已实现的完整功能：**

1. **分类系统**
   - 管理员创建和管理分类
   - 初始分类：装修问答、装修开箱、好物推荐、维护问题

2. **发帖功能**
   - 创建帖子（标题、内容、标签、分类）
   - 上传图片/视频（支持多媒体）
   - 编辑/删除自己的帖子

3. **评论系统**
   - 评论帖子
   - 嵌套评论（回复评论）
   - 点赞评论

4. **互动功能**
   - 点赞帖子/评论
   - 关注用户
   - 收藏帖子
   - 转发帖子
   - 私信功能

5. **用户资料**
   - 查看用户主页
   - 显示粉丝/关注数
   - 显示用户所有帖子

### 🏗️ 技术架构

```
UI (React + TailwindCSS)
    ↓
Redux Thunks (State Management)
    ↓
Repository (Business Logic)
    ↓
Mapper (Data Transformation)
    ↓
Supabase (PostgreSQL + Auth + Storage + Realtime)
```

---

## 数据库设置

### 步骤 1: 执行 SQL 迁移

1. 登录 [Supabase Dashboard](https://app.supabase.com/project/jufwllhkgtvovyazgxld)
2. 进入 **SQL Editor**
3. 复制 `supabase/migrations/003_forum_system.sql` 的完整内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

### 步骤 2: 验证数据库结构

执行以下查询验证表已创建：

```sql
-- 检查所有表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'categories', 'posts', 'comments', 'likes', 
  'follows', 'messages', 'reposts', 'bookmarks'
);

-- 检查初始分类
SELECT * FROM categories;

-- 应该返回 4 个分类
```

### 步骤 3: 验证 RLS 策略

```sql
-- 检查 RLS 已启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'categories', 'posts', 'comments', 'likes', 
  'follows', 'messages', 'reposts', 'bookmarks'
);

-- 所有表的 rowsecurity 应该为 true
```

### 数据库模式说明

#### 核心表结构

**categories** - 分类表
```sql
- id: UUID (主键)
- name: TEXT (分类名称)
- slug: TEXT (URL友好标识)
- description: TEXT (描述)
- is_active: BOOLEAN (是否启用)
```

**posts** - 帖子表
```sql
- id: UUID (主键)
- user_id: UUID (作者)
- category_id: UUID (分类)
- title: TEXT (标题)
- content: TEXT (内容)
- tags: TEXT[] (标签数组)
- media_urls: TEXT[] (媒体URL数组)
- like_count: INTEGER (点赞数)
- comment_count: INTEGER (评论数)
- repost_count: INTEGER (转发数)
- bookmark_count: INTEGER (收藏数)
```

**comments** - 评论表
```sql
- id: UUID (主键)
- post_id: UUID (帖子ID)
- user_id: UUID (评论者)
- parent_id: UUID (父评论ID，支持嵌套)
- content: TEXT (内容)
- media_urls: TEXT[] (媒体URL)
- like_count: INTEGER (点赞数)
```

**其他表**
- `likes` - 点赞表（多态：支持帖子和评论）
- `follows` - 关注表
- `messages` - 私信表
- `reposts` - 转发表
- `bookmarks` - 收藏表

---

## Supabase Storage 配置

### 步骤 1: 创建 Storage Bucket

1. 进入 Supabase Dashboard
2. 点击左侧 **Storage**
3. 点击 **Create bucket**
4. 设置：
   - Name: `forum-media`
   - Public: **Yes** (选中)
   - File size limit: `50 MB`
   - Allowed MIME types: `image/*,video/*`
5. 点击 **Create bucket**

### 步骤 2: 设置 Storage 策略

在 Storage > Policies 中添加以下策略：

```sql
-- 允许认证用户上传
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-media');

-- 允许所有人查看
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-media');

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'forum-media' AND
  owner = auth.uid()
);
```

### 步骤 3: 验证上传功能

上传测试文件：

```bash
# 在浏览器控制台测试
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('forum-media')
  .upload('test/test.jpg', file);
console.log(data, error);
```

---

## Realtime 配置

### 步骤 1: 启用 Realtime

1. 进入 Supabase Dashboard
2. 点击左侧 **Database**
3. 点击 **Replication**
4. 找到以下表并启用 Realtime：
   - `posts`
   - `comments`
   - `likes`
   - `messages`

### 步骤 2: 配置 Realtime 订阅

在代码中添加 Realtime 订阅（可选增强）：

```typescript
// src/services/realtimeService.ts
import { supabase } from '@/core/infrastructure/supabase/client';

export const subscribeToNewPosts = (callback: (post: any) => void) => {
  return supabase
    .channel('posts')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

export const subscribeToNewComments = (postId: string, callback: (comment: any) => void) => {
  return supabase
    .channel(`comments:${postId}`)
    .on('postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `post_id=eq.${postId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};
```

### 步骤 3: 测试 Realtime

```javascript
// 订阅新帖子
const subscription = subscribeToNewPosts((post) => {
  console.log('New post:', post);
});

// 取消订阅
subscription.unsubscribe();
```

---

## 测试流程

### 🧪 完整测试步骤

#### 1. 管理员创建分类（Admin Console）

**前提：** 需要一个管理员账户

```sql
-- 设置用户为管理员
UPDATE app_users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

**测试步骤：**
1. 以管理员身份登录
2. 访问 `/admin/categories` (需要创建此页面，或通过 SQL)
3. 创建新分类

**SQL 方式创建分类：**
```sql
INSERT INTO categories (name, slug, description)
VALUES ('新分类', 'new-category', '这是一个新分类');
```

#### 2. 用户注册和登录

```bash
# 访问注册页
http://localhost:3000/register

# 注册新用户
Username: forum_user
Email: user@test.com
Password: Test123456
Role: Homeowner

# 登录
http://localhost:3000/login
```

#### 3. 创建帖子

1. 登录后访问 `/forum`
2. 点击 **+ New Post** 按钮
3. 填写表单：
   - 选择分类：装修问答
   - 标题：如何选择地板材料？
   - 内容：我正在装修新房，想咨询一下地板材料的选择...
   - 标签：地板,材料,装修
   - 上传图片（可选）
4. 点击 **Post** 提交

**验证：**
- ✅ 帖子出现在论坛首页
- ✅ 可以在分类筛选中看到
- ✅ 图片正确显示

#### 4. 测试点赞功能

1. 在论坛首页找到一个帖子
2. 点击 ❤️ 图标
3. **验证：**
   - ✅ 图标变红
   - ✅ 点赞数 +1
   - ✅ 再次点击取消点赞
   - ✅ 数字减少

#### 5. 测试评论功能

1. 点击帖子卡片进入详情页
2. 在评论框输入：很有用的分享！
3. 点击 **Comment** 提交

**测试嵌套评论：**
1. 在已有评论下点击 **Reply**
2. 输入回复内容
3. 提交

**验证：**
- ✅ 评论立即显示
- ✅ 回复正确嵌套
- ✅ 评论数更新

#### 6. 测试关注功能

1. 点击帖子作者头像进入个人主页
2. 点击 **Follow** 按钮
3. **验证：**
   - ✅ 按钮变为 "Following"
   - ✅ 粉丝数 +1

#### 7. 测试私信功能

1. 在用户主页点击 **Message** 按钮
2. 输入消息内容
3. 点击发送

**验证：**
- ✅ 消息出现在对话中
- ✅ 实时显示

#### 8. 测试收藏和转发

**收藏：**
1. 点击帖子卡片上的书签图标
2. ✅ 图标变黄色
3. ✅ 收藏数 +1

**转发：**
1. 点击转发图标
2. ✅ 图标变绿色
3. ✅ 转发数 +1

#### 9. 测试媒体上传

1. 创建新帖子
2. 点击文件上传
3. 选择多张图片（测试最多 4 张）
4. 提交帖子

**验证：**
- ✅ 图片上传到 Supabase Storage
- ✅ 帖子显示缩略图
- ✅ 点击可查看大图

#### 10. 测试分类筛选

1. 在论坛首页点击不同分类
2. **验证：**
   - ✅ 只显示该分类的帖子
   - ✅ URL 更新
   - ✅ 点击 "All Posts" 显示所有

#### 11. 测试无限滚动

1. 创建多个帖子（至少 25 个）
2. 在论坛首页向下滚动
3. **验证：**
   - ✅ 滚动到底部自动加载更多
   - ✅ 显示加载动画
   - ✅ 到达末尾显示 "You've reached the end"

---

## 功能列表

### ✅ 已实现功能

#### 用户功能
- [x] 用户注册/登录
- [x] 查看和编辑个人资料
- [x] 关注/取消关注用户
- [x] 查看粉丝和关注列表

#### 帖子功能
- [x] 创建帖子（标题、内容、标签、分类）
- [x] 上传图片/视频
- [x] 编辑自己的帖子
- [x] 删除自己的帖子
- [x] 按分类浏览帖子
- [x] 无限滚动加载

#### 互动功能
- [x] 点赞帖子
- [x] 点赞评论
- [x] 评论帖子
- [x] 回复评论（嵌套）
- [x] 收藏帖子
- [x] 转发帖子

#### 社交功能
- [x] 关注用户
- [x] 私信聊天
- [x] 查看用户主页
- [x] 显示用户统计（帖子数、粉丝数）

#### 分类管理
- [x] 管理员创建分类
- [x] 分类导航
- [x] 分类筛选

### 🔜 可扩展功能

#### 短期扩展
- [ ] 帖子搜索功能
- [ ] 标签页面
- [ ] 热门帖子排序
- [ ] 通知系统
- [ ] 举报功能

#### 中期扩展
- [ ] 富文本编辑器
- [ ] Emoji 支持
- [ ] GIF 支持
- [ ] 提及用户 (@mention)
- [ ] 话题标签 (#hashtag)

#### 长期扩展
- [ ] 推荐算法
- [ ] 趋势话题
- [ ] 用户徽章系统
- [ ] 积分系统
- [ ] 内容审核工具

---

## 性能优化建议

### 1. 数据库优化

**已实现的索引：**
```sql
-- 帖子索引
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- 评论索引
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- 点赞索引
CREATE INDEX idx_likes_target ON likes(target_id, target_type);
```

### 2. 前端优化

**已实现：**
- ✅ 无限滚动（减少初始加载）
- ✅ 图片懒加载
- ✅ React.memo 优化重渲染

**建议添加：**
- 虚拟滚动（大量数据）
- 图片压缩
- CDN 加速

### 3. 缓存策略

```typescript
// Redux 中实现缓存
const postsCache = new Map();

export const fetchPostsWithCache = createAsyncThunk(
  'forum/fetchPostsWithCache',
  async (categoryId: string) => {
    const cacheKey = `posts_${categoryId}`;
    if (postsCache.has(cacheKey)) {
      return postsCache.get(cacheKey);
    }
    
    const result = await forumRepository.getPosts(categoryId);
    postsCache.set(cacheKey, result);
    return result;
  }
);
```

---

## 常见问题

### Q: 如何处理大量图片上传？

A: 
1. 限制文件大小（当前 50MB）
2. 客户端压缩图片：
```typescript
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  };
  return await imageCompression(file, options);
};
```

### Q: 如何实现实时通知？

A: 使用 Supabase Realtime：
```typescript
// 订阅新消息
supabase
  .channel(`user:${userId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
    (payload) => {
      // 显示通知
      showNotification(payload.new);
    }
  )
  .subscribe();
```

### Q: 如何防止垃圾内容？

A: 
1. 内容过滤（添加到 Repository）：
```typescript
const containsSpam = (content: string) => {
  const spamWords = ['spam', 'ad', '广告'];
  return spamWords.some(word => content.toLowerCase().includes(word));
};
```

2. 用户举报系统
3. 管理员审核队列

---

## 部署检查清单

### Supabase 配置
- [ ] 所有 SQL 迁移已执行
- [ ] RLS 策略已启用
- [ ] Storage bucket 已创建
- [ ] Realtime 已启用
- [ ] 环境变量已配置

### 应用配置
- [ ] `.env` 文件已设置
- [ ] 生产环境 URL 已更新
- [ ] CORS 已配置
- [ ] 错误监控已设置

### 性能优化
- [ ] 图片已压缩
- [ ] 懒加载已启用
- [ ] 缓存策略已实施
- [ ] CDN 已配置（如需要）

### 安全检查
- [ ] RLS 策略测试通过
- [ ] 用户权限验证
- [ ] XSS 防护
- [ ] CSRF 防护

---

## 快速命令参考

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### SQL 快捷命令

```sql
-- 创建测试帖子
INSERT INTO posts (user_id, category_id, title, content, tags)
SELECT 
  u.id,
  c.id,
  '测试帖子标题',
  '这是测试内容',
  ARRAY['测试', '示例']
FROM app_users u, categories c
WHERE u.username = 'test_user' AND c.slug = 'renovation_qa';

-- 查看最新帖子
SELECT * FROM posts_with_user ORDER BY created_at DESC LIMIT 10;

-- 查看用户统计
SELECT * FROM get_user_stats('user-id-here');
```

---

## 🎉 完成！

你的现代化论坛系统已完全配置并可使用！

**下一步：**
1. 执行数据库迁移
2. 配置 Storage
3. 启用 Realtime
4. 开始测试

需要帮助？查看 `FORUM_SETUP_GUIDE.md` 获取详细信息。
