import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jufwllhkgtvovyazgxld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZndsbGhrZ3R2b3Z5YXpneGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDU4NTYsImV4cCI6MjA3NTE4MTg1Nn0.Qr5U__VbJg6PUwpNyPaQUFlut8IvURLW19_DOoXAx9M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('=== 測試個人檔案查詢 ===\n');

  // 1. 獲取當前登入用戶
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ 未登入或無法獲取用戶資訊');
    console.log('請先在網站上登入，然後重新運行此腳本\n');
    return;
  }

  console.log('✅ 已登入用戶 ID:', user.id);
  console.log('   Email:', user.email);
  console.log();

  // 2. 測試 RPC 函數
  console.log('[Step 1] 測試 RPC 函數...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_with_stats', {
    user_uuid: user.id,
  });

  if (rpcError) {
    console.log('⚠️  RPC 函數失敗:', rpcError.message);
    console.log('   這是正常的，會使用回退方案\n');
  } else if (rpcData && rpcData.length > 0) {
    console.log('✅ RPC 函數成功');
    console.log('   Username:', rpcData[0].username);
    console.log('   Email:', rpcData[0].email);
    console.log('   Stats: followers=', rpcData[0].follower_count, 'following=', rpcData[0].following_count);
    console.log();
  }

  // 3. 測試直接查詢 app_users
  console.log('[Step 2] 測試直接查詢 app_users 表...');
  const { data: userData, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (userError) {
    console.error('❌ 查詢 app_users 失敗:', userError.message);
    console.error('   Code:', userError.code);
    console.error('   Details:', userError.details);
    console.log();
    return;
  }

  if (!userData) {
    console.error('❌ 找不到用戶資料');
    console.log('   用戶可能未在 app_users 表中');
    console.log();
    return;
  }

  console.log('✅ app_users 查詢成功');
  console.log('   ID:', userData.id);
  console.log('   Username:', userData.username);
  console.log('   Email:', userData.email);
  console.log('   Role:', userData.role);
  console.log('   Full Name:', userData.full_name || '(未設定)');
  console.log('   Bio:', userData.bio || '(未設定)');
  console.log('   Company Name:', userData.company_name || '(未設定)');
  console.log('   Created At:', userData.created_at);
  console.log();

  // 4. 測試 user_profiles 視圖
  console.log('[Step 3] 測試 user_profiles 視圖...');
  const { data: viewData, error: viewError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (viewError) {
    console.log('⚠️  user_profiles 視圖查詢失敗:', viewError.message);
    console.log('   這可能需要執行 FIX_PROFILE_ISSUES.sql');
    console.log();
  } else if (viewData) {
    console.log('✅ user_profiles 視圖查詢成功');
    console.log('   包含欄位:', Object.keys(viewData).join(', '));
    console.log();
  }

  console.log('=== 測試完成 ===');
  console.log('\n總結:');
  console.log('1. 用戶資料存在:', userData ? '✅' : '❌');
  console.log('2. 基本資訊完整:', userData && userData.username && userData.email ? '✅' : '❌');
  console.log('3. 個人檔案應該可以顯示');
  console.log('\n如果網站仍顯示「找不到使用者」，請:');
  console.log('1. 清除瀏覽器緩存並重新載入');
  console.log('2. 查看瀏覽器 Console 的詳細錯誤');
  console.log('3. 確認已執行 FIX_PROFILE_ISSUES.sql');
}

run().catch((err) => {
  console.error('❌ 執行錯誤:', err);
});
