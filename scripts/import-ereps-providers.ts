// scripts/import-ereps-providers.ts
// Import accredited providers from the JSON file exported by the browser script

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface ProviderData {
  name: string;
  country: string;
  qualifications: string[];
  profilePath: string;
  profileUrl: string;
}

function createSlug(name: string, country: string): string {
  return (name + '-' + country)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function importProviders() {
  try {
    console.log('Reading providers JSON file...');
    
    const jsonPath = path.join(process.cwd(), 'scripts', 'ereps-providers.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('File not found: scripts/ereps-providers.json');
      console.log('\nPlease:');
      console.log('1. Go to https://www.ereps.eu/acc-provider-directory');
      console.log('2. Open browser console (F12)');
      console.log('3. Paste the contents of scripts/browser-extract-ereps-providers.js');
      console.log('4. Save the downloaded file as scripts/ereps-providers.json');
      console.log('5. Run this script again');
      process.exit(1);
    }
    
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const providers: ProviderData[] = JSON.parse(jsonContent);
    
    console.log('Parsed ' + providers.length + ' providers from JSON');
    
    // Check existing providers
    const existingProviders = await prisma.accredited_providers.findMany({
      select: { name: true, country: true }
    });
    
    const existingKeys = new Set(
      existingProviders.map(p => p.name + '|' + p.country)
    );
    
    console.log('Found ' + existingKeys.size + ' existing providers in database');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const provider of providers) {
      try {
        const key = provider.name + '|' + provider.country;
        
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        
        if (!provider.name) {
          skipped++;
          continue;
        }
        
        await prisma.accredited_providers.create({
          data: {
            id: crypto.randomUUID(),
            name: provider.name,
            country: provider.country || 'Unknown',
            qualifications: provider.qualifications,
            profilePath: provider.profilePath,
            profileUrl: provider.profileUrl,
            slug: createSlug(provider.name, provider.country || 'Unknown'),
            source: 'EREPS',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        imported++;
        existingKeys.add(key);
        
        if (imported % 50 === 0) {
          console.log('Imported ' + imported + ' providers...');
        }
      } catch (error) {
        errors++;
        console.error('Error importing provider "' + provider.name + '":', error);
      }
    }
    
    console.log('\nImport complete!');
    console.log('Imported: ' + imported);
    console.log('Skipped: ' + skipped);
    console.log('Errors: ' + errors);
    console.log('Total in database: ' + (existingKeys.size + imported));
    
  } catch (error) {
    console.error('Error importing providers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importProviders();
