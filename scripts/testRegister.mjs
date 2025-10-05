import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jufwllhkgtvovyazgxld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZndsbGhrZ3R2b3Z5YXpneGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDU4NTYsImV4cCI6MjA3NTE4MTg1Nn0.Qr5U__VbJg6PUwpNyPaQUFlut8IvURLW19_DOoXAx9M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'TestPassword123!';
  const username = `testuser${timestamp}`.substring(0, 20); // 確保長度符合限制

  console.log('=== 開始註冊測試 ===');
  console.log('Email:', email);
  console.log('Username:', username);

  // Step 1: 檢查 username 是否可用
  console.log('\n[Step 1] 檢查 username 可用性...');
  const { data: isAvailable, error: checkError } = await supabase.rpc(
    'is_username_available',
    { check_username: username }
  );

  if (checkError) {
    console.error('❌ Username check failed:', checkError);
    return;
  }

  if (!isAvailable) {
    console.error('❌ Username already taken');
    return;
  }
  console.log('✅ Username available');

  // Step 2: Supabase Auth SignUp
  console.log('\n[Step 2] 執行 auth.signUp...');
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (signUpError) {
    console.error('❌ Sign up error:', signUpError);
    return;
  }

  if (!authData.user) {
    console.error('❌ No user returned from sign up');
    return;
  }

  console.log('✅ Auth user created. ID:', authData.user.id);
  console.log('   Session:', authData.session ? '✅ Created' : '⚠️ Email confirmation needed');

  // Step 3: 插入到 app_users
  console.log('\n[Step 3] 插入到 app_users...');
  const { error: insertError } = await supabase
    .from('app_users')
    .upsert(
      {
        id: authData.user.id,
        username,
        email,
        role: 'homeowner',
        full_name: 'Test User',
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);
    return;
  }
  console.log('✅ User profile created in app_users');

  // Step 4: 查詢 user_profiles
  console.log('\n[Step 4] 查詢 user_profiles...');
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    console.error('❌ Profile fetch error:', profileError);
    return;
  }

  console.log('✅ User profile fetched successfully');
  console.log('   Username:', profileData.username);
  console.log('   Email:', profileData.email);
  console.log('   Role:', profileData.role);

  // Cleanup
  console.log('\n[Cleanup] 登出...');
  await supabase.auth.signOut();
  console.log('✅ 測試完成！');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
});
