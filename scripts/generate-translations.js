import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk'];
const NAMESPACES = ['common', 'profile', 'recipes'];

async function generateTranslations() {
  try {
    // Create locales directory if it doesn't exist
    const localesDir = join(process.cwd(), 'public', 'locales');
    await fs.mkdir(localesDir, { recursive: true });

    // Create language directories and copy English translations as templates
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en') continue; // Skip English as it's our source

      const langDir = join(localesDir, lang);
      await fs.mkdir(langDir, { recursive: true });

      // Copy each namespace file
      for (const ns of NAMESPACES) {
        const sourceFile = join(localesDir, 'en', `${ns}.json`);
        const targetFile = join(langDir, `${ns}.json`);

        try {
          // Check if target file exists
          await fs.access(targetFile);
          console.log(`Skipped existing file: ${targetFile}`);
        } catch {
          // File doesn't exist, create it
          const content = await fs.readFile(sourceFile, 'utf8');
          await fs.writeFile(targetFile, content);
          console.log(`Created ${targetFile}`);
        }
      }
    }

    console.log('Translation templates generated successfully!');
    console.log('Please translate the contents of each generated file.');
  } catch (error) {
    console.error('Error generating translations:', error);
    process.exit(1);
  }
}

generateTranslations(); 