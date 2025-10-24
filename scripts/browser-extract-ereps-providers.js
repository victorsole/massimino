// BROWSER CONSOLE SCRIPT - Run this in F12 Console on https://www.ereps.eu/acc-provider-directory
// This script extracts all accredited providers from all pages

(async function extractAllProviders() {
  const allProviders = [];
  const baseUrl = 'https://www.ereps.eu';
  
  // Function to extract providers from current page
  function extractProvidersFromPage() {
    const rows = document.querySelectorAll('tbody tr');
    const providers = [];
    
    rows.forEach(row => {
      const nameEl = row.querySelector('.views-field-display-name');
      const countryEl = row.querySelector('.views-field-country');
      const qualEl = row.querySelector('.views-field-qualification--67');
      const linkEl = row.querySelector('.views-field-nothing a');
      
      if (nameEl) {
        const name = nameEl.textContent.trim();
        const country = countryEl ? countryEl.textContent.trim() : '';
        const qualifications = qualEl ? 
          qualEl.textContent.trim().split(',').map(q => q.trim()).filter(Boolean) : 
          [];
        const profilePath = linkEl ? linkEl.getAttribute('href') : '';
        const profileUrl = profilePath ? baseUrl + profilePath : '';
        
        providers.push({
          name,
          country,
          qualifications,
          profilePath,
          profileUrl
        });
      }
    });
    
    return providers;
  }
  
  // Extract from first page
  console.log('Extracting from current page...');
  allProviders.push(...extractProvidersFromPage());
  console.log('Found ' + allProviders.length + ' providers so far...');
  
  console.log('\nExtraction complete! Found ' + allProviders.length + ' providers.');
  console.log('\nCopy the JSON below and save it to a file:\n');
  console.log(JSON.stringify(allProviders, null, 2));
  
  // Also download automatically
  const dataStr = JSON.stringify(allProviders, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ereps-providers.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('\nFile "ereps-providers.json" downloaded automatically!');
  
  return allProviders;
})();
