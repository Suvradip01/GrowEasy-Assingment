const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show 489365e:frontend/src/app/page.tsx', { encoding: 'utf-8' });
  fs.writeFileSync('original_page.tsx', content);
  console.log('Successfully wrote original_page.tsx');
} catch (error) {
  console.error('Error:', error);
}
