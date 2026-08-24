const fs = require('fs');
const path = require('path');

let supabase = null;

// Initialize Supabase if credentials exist
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('Successfully connected to Supabase Database Cluster! ⚡');
  } catch (err) {
    console.error('Failed to load @supabase/supabase-js package:', err);
  }
} else {
  console.log('No Supabase credentials detected. Operating on local file-system fallback mode. 📁');
}

// -------------------------------------------------------------
// LOCAL FILESYSTEM FALLBACK IMPLEMENTATION
// -------------------------------------------------------------
function readLocalFile(filename, defaultVal) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  if (!fs.existsSync(filePath)) return defaultVal;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']') + 1;
    if (start > -1 && end > -1) {
      return JSON.parse(content.substring(start, end));
    }
    // Fallback for profiles and settings which might be objects
    const objectStart = content.indexOf('{');
    const objectEnd = content.lastIndexOf('}') + 1;
    if (objectStart > -1 && objectEnd > -1) {
      return JSON.parse(content.substring(objectStart, objectEnd));
    }
  } catch (e) {
    console.error(`Failed to read local file ${filename}:`, e);
  }
  return defaultVal;
}

function writeLocalFile(filename, varName, data) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  try {
    const content = `const ${varName} = ${JSON.stringify(data, null, 2)};\n\nexport default ${varName};\n`;
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (e) {
    console.error(`Failed to write local file ${filename}:`, e);
    return false;
  }
}

// -------------------------------------------------------------
// DATABASE INTERFACE METHODS (WITH FALLBACK)
// -------------------------------------------------------------

// 1. PRODUCTS
async function getProducts() {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Supabase getProducts error:', error);
      return readLocalFile('products.js', []);
    }
    return data.map(item => item.data);
  }
  return readLocalFile('products.js', []);
}

async function saveProducts(productsList) {
  if (supabase) {
    const rows = productsList.map(p => ({ id: String(p.id || p.sku || Date.now()), data: p }));
    const { error } = await supabase.from('products').upsert(rows);
    if (error) {
      console.error('Supabase saveProducts error:', error);
      return writeLocalFile('products.js', 'products', productsList);
    }
    return true;
  }
  return writeLocalFile('products.js', 'products', productsList);
}

// 2. ORDERS
async function getOrders() {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) {
      console.error('Supabase getOrders error:', error);
      return readLocalFile('orders.js', []);
    }
    const list = (data || []).map(item => item ? (item.data || item) : null).filter(Boolean);
    return list.length > 0 ? list : readLocalFile('orders.js', []);
  }
  return readLocalFile('orders.js', []);
}

async function saveOrders(ordersList) {
  const cleanList = (ordersList || []).filter(Boolean);
  if (supabase) {
    const rows = cleanList.map(o => ({ id: String(o.id), data: o }));
    const { error } = await supabase.from('orders').upsert(rows);
    if (error) {
      console.error('Supabase saveOrders error:', error);
      return writeLocalFile('orders.js', 'orders', cleanList);
    }
    writeLocalFile('orders.js', 'orders', cleanList);
    return true;
  }
  return writeLocalFile('orders.js', 'orders', cleanList);
}

// 3. COUPONS
async function getCoupons() {
  if (supabase) {
    const { data, error } = await supabase.from('coupons').select('*');
    if (error) {
      console.error('Supabase getCoupons error:', error);
      return readLocalFile('coupons.js', []);
    }
    return data.map(item => item.data);
  }
  return readLocalFile('coupons.js', []);
}

async function saveCoupons(couponsList) {
  if (supabase) {
    const rows = couponsList.map(c => ({ code: c.code, data: c }));
    const { error } = await supabase.from('coupons').upsert(rows);
    if (error) {
      console.error('Supabase saveCoupons error:', error);
      return writeLocalFile('coupons.js', 'coupons', couponsList);
    }
    return true;
  }
  return writeLocalFile('coupons.js', 'coupons', couponsList);
}

// 4. USER PROFILES
async function getProfiles() {
  if (supabase) {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Supabase getProfiles error:', error);
      return readLocalFile('profiles.js', {});
    }
    const profilesMap = {};
    data.forEach(item => {
      if (item && item.email) {
        profilesMap[item.email.toLowerCase()] = item.data;
      }
    });
    return profilesMap;
  }
  return readLocalFile('profiles.js', {});
}

async function saveProfile(email, profileData) {
  if (supabase) {
    const { error } = await supabase.from('profiles').upsert({ email: email.toLowerCase(), data: profileData });
    if (error) {
      console.error('Supabase saveProfile error:', error);
      const profilesMap = readLocalFile('profiles.js', {});
      profilesMap[email.toLowerCase()] = profileData;
      writeLocalFile('profiles.js', 'profiles', profilesMap);
    }
    return true;
  }
  const profilesMap = readLocalFile('profiles.js', {});
  profilesMap[email.toLowerCase()] = profileData;
  return writeLocalFile('profiles.js', 'profiles', profilesMap);
}

// 5. OWED COUPONS
async function getOwedCoupons() {
  if (supabase) {
    const { data, error } = await supabase.from('owed_coupons').select('*');
    if (error) {
      console.error('Supabase getOwedCoupons error:', error);
      return readLocalFile('owed_coupons.js', []);
    }
    return data.map(item => item.data);
  }
  return readLocalFile('owed_coupons.js', []);
}

async function saveOwedCoupons(owedList) {
  if (supabase) {
    const rows = owedList.map(o => ({ email: o.email.toLowerCase(), data: o }));
    const { error } = await supabase.from('owed_coupons').upsert(rows);
    if (error) {
      console.error('Supabase saveOwedCoupons error:', error);
      return writeLocalFile('owed_coupons.js', 'owed_coupons', owedList);
    }
    return true;
  }
  return writeLocalFile('owed_coupons.js', 'owed_coupons', owedList);
}

async function getSetting(key, defaultVal, localFilename) {
  if (supabase) {
    const { data, error } = await supabase.from('sweetos_settings').select('*').eq('key', key).single();
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is single row not found
        console.error(`Supabase getSetting error for key ${key}:`, error);
      }
      return readLocalFile(localFilename, defaultVal);
    }
    return data.value;
  }
  return readLocalFile(localFilename, defaultVal);
}

async function saveSetting(key, val, localFilename, localVarName) {
  if (supabase) {
    const { error } = await supabase.from('sweetos_settings').upsert({ key, value: val, updated_at: new Date().toISOString() });
    if (error) {
      console.error(`Supabase saveSetting error for key ${key}:`, error);
      return writeLocalFile(localFilename, localVarName, val);
    }
    return true;
  }
  return writeLocalFile(localFilename, localVarName, val);
}

module.exports = {
  getProducts,
  saveProducts,
  getOrders,
  saveOrders,
  getCoupons,
  saveCoupons,
  getProfiles,
  saveProfile,
  getOwedCoupons,
  saveOwedCoupons,
  getSetting,
  saveSetting
};
