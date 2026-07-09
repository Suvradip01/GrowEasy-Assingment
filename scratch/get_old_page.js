const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show HEAD^:frontend/src/app/page.tsx', { encoding: 'utf-8' });
  fs.writeFileSync('old_page.tsx', content);
  console.log('Successfully wrote old_page.tsx');
} catch (error) {
  console.error('Error:', error);
}
