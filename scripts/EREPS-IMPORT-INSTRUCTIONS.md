# Import Accredited Providers from EREPs

This guide explains how to import accredited providers from https://www.ereps.eu/acc-provider-directory

## Step 1: Extract Data from Browser

1. Go to https://www.ereps.eu/acc-provider-directory in your browser
2. Open Browser Console (Press `F12` or `Cmd+Option+I` on Mac)
3. Open the file `scripts/browser-extract-ereps-providers.js`
4. Copy its entire contents
5. Paste into the browser console and press Enter
6. The script will:
   - Extract all providers from the current page
   - Automatically download a file called `ereps-providers.json`
   - Display the JSON in the console (as backup)

## Step 2: Move the Downloaded File

Move the downloaded `ereps-providers.json` file to the `scripts/` directory:

```bash
mv ~/Downloads/ereps-providers.json scripts/ereps-providers.json
```

## Step 3: Import to Database

Run the import script:

```bash
npx ts-node scripts/import-ereps-providers.ts
```

This will:
- Read the JSON file
- Import all providers to the database
- Skip duplicates (based on name + country)
- Show import statistics

## What Gets Imported

Each provider includes:
- **Name**: Organization name
- **Country**: Location
- **Qualifications**: List of accredited qualifications (e.g., "Personal Trainer", "Fitness Instructor")
- **Profile URL**: Link to full profile on EREPs
- **Slug**: URL-friendly identifier
- **Source**: "EREPS" (for tracking data source)

## Notes

- The script avoids duplicates using the combination of name + country
- Providers without names are skipped
- If a provider exists, it won't be re-imported
- The browser script only extracts from the current page (you may need to navigate through pages manually if the site has pagination)

## Troubleshooting

**File not found error?**
- Make sure `ereps-providers.json` is in the `scripts/` directory

**Import errors?**
- Check that your `DATABASE_URL` is set correctly in `.env`
- Ensure the Prisma client is generated: `npx prisma generate`

**No data extracted?**
- Make sure you're on the correct EREPs page
- Check that the browser console shows the JSON output
- Try refreshing the page and running the browser script again
