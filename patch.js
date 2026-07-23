const fs = require('fs');
const path = require('path');

const directories = [
  'C:/Users/satya/Downloads/pharmaflow-erp-main/pharmaflow-erp-main/apps/desktop/src/pages/accounts',
  'C:/Users/satya/Downloads/pharmaflow-erp-main/pharmaflow-erp-main/apps/desktop/src/pages/reports',
  'C:/Users/satya/Downloads/pharmaflow-erp-main/pharmaflow-erp-main/apps/desktop/src/pages/inventory',
  'C:/Users/satya/Downloads/pharmaflow-erp-main/pharmaflow-erp-main/apps/desktop/src/pages/transactions',
  'C:/Users/satya/Downloads/pharmaflow-erp-main/pharmaflow-erp-main/apps/desktop/src/pages/admin'
];

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('../../data/mockData')) return;

  // Ensure useEffect is imported
  if (!content.includes('useEffect')) {
    if (content.includes('import React, { useState } from')) {
      content = content.replace('import React, { useState } from', 'import React, { useState, useEffect } from');
    } else if (content.includes("import React, { useState, useMemo } from")) {
      content = content.replace("import React, { useState, useMemo } from", "import React, { useState, useEffect, useMemo } from");
    } else if (content.includes("import React from 'react';")) {
      content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';");
    } else {
      content = "import React, { useState, useEffect } from 'react';\n" + content;
    }
  }
  
  // Find what is imported from mockData
  const mockDataImportMatch = content.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/\.\.\/data\/mockData['"];?/);
  if (!mockDataImportMatch) return;
  
  const imports = mockDataImportMatch[1].split(',').map(s => s.trim());
  content = content.replace(mockDataImportMatch[0], '');
  
  let stateHooks = '';
  let fetchLogic = '\n  useEffect(() => {\n    const fetchData = async () => {\n';
  
  imports.forEach(imp => {
    stateHooks += `  const [${imp}, set_${imp}] = useState([]);\n`;
    if (imp === 'customers') fetchLogic += `      const res_${imp} = await window.pharmaAPI.db.query("SELECT * FROM customers");\n      set_${imp}(res_${imp}?.data || []);\n`;
    else if (imp === 'suppliers') fetchLogic += `      const res_${imp} = await window.pharmaAPI.db.query("SELECT * FROM suppliers");\n      set_${imp}(res_${imp}?.data || []);\n`;
    else if (imp === 'products') fetchLogic += `      const res_${imp} = await window.pharmaAPI.db.query("SELECT * FROM products");\n      set_${imp}(res_${imp}?.data || []);\n`;
    else if (imp === 'categories') fetchLogic += `      const res_${imp} = await window.pharmaAPI.db.query("SELECT * FROM categories");\n      set_${imp}(res_${imp}?.data || []);\n`;
    else if (imp === 'manufacturers') fetchLogic += `      const res_${imp} = await window.pharmaAPI.db.query("SELECT * FROM manufacturers");\n      set_${imp}(res_${imp}?.data || []);\n`;
    else fetchLogic += `      set_${imp}([]);\n`;
  });
  
  fetchLogic += `    };\n    fetchData();\n  }, []);\n`;
  
  // Insert state hooks and fetchLogic right inside the component function
  const componentMatch = content.match(/export\s+default\s+function\s+\w+\(\)\s*\{/);
  if (componentMatch) {
    const insertPos = componentMatch.index + componentMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + stateHooks + fetchLogic + content.slice(insertPos);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${filePath}`);
  } else {
    console.log(`Could not find component function in ${filePath}`);
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
    files.forEach(f => patchFile(path.join(dir, f)));
  }
});
