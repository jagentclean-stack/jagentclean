import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'jagent_cleaning',
});

try {
  // 更新兩個帳號為 Admin 角色
  const emails = ['jagentclean@gmail.com', 'emilyku0jj@gmail.com'];
  
  for (const email of emails) {
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', email]
    );
    console.log(`✅ Updated ${email}: ${result.affectedRows} row(s) affected`);
  }

  // 驗證更新結果
  const [rows] = await connection.execute(
    'SELECT id, email, role FROM users WHERE email IN (?, ?)',
    emails
  );
  
  console.log('\n📋 Updated users:');
  rows.forEach(row => {
    console.log(`  - ${row.email}: ${row.role}`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await connection.end();
}
