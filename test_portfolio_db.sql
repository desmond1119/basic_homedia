-- 測試 Portfolio 資料庫
-- 複製到 Supabase Dashboard SQL Editor 執行
-- https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql

-- 測試 A: 查看分類
SELECT * FROM portfolio_categories;

-- 測試 B: 查看 portfolios
SELECT * FROM portfolios LIMIT 5;

-- 測試 C: 查看 portfolio_feed view
SELECT * FROM portfolio_feed LIMIT 5;

-- 測試 D: 檢查 RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename LIKE 'portfolio%'
ORDER BY tablename, policyname;

-- 測試 E: 檢查 triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%portfolio%';
