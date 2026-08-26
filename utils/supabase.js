// Supabase Client & Backend Synchronization Engine
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import initialProducts from '../data/products.js';

export const SUPABASE_URL = 'https://xtonsvyyfnjimlxtauwv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b25zdnl5Zm5qaW1seHRhdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTI5MzAsImV4cCI6MjEwMjg4ODkzMH0.3zZ1SKKTvWrQLbxv067KlbOrkTMaWkusDDdYeKEFMO0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. PRODUCTS SYNC & CRUD
// ==========================================

export async function fetchProductsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Could not fetch products, falling back to local:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      const formatted = data.map(p => ({
        id: p.legacy_id || p.id,
        uuid: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: parseFloat(p.price) || 0,
        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
        category: p.category_name || '',
        subcategory: p.subcategory_name || '',
        brand: p.brand_name || '',
        image: p.image,
        gallery: p.gallery || [],
        colors: p.colors || [],
        specs: p.specs || {},
        stock: p.stock ?? 10,
        inStock: p.in_stock ?? true,
        isBestseller: p.is_bestseller ?? false,
        isHotDeal: p.is_hot_deal ?? false,
        isNew: p.is_new ?? false,
        rating: p.rating ? parseFloat(p.rating) : 5.0,
        reviews: p.reviews_count ?? 0
      }));

      localStorage.setItem('SWEETOS_products', JSON.stringify(formatted));
      return formatted;
    } else {
      await seedProductsToSupabase();
      return initialProducts;
    }
  } catch (err) {
    console.error('[Supabase] fetchProducts error:', err);
    return null;
  }
}

export async function seedProductsToSupabase() {
  try {
    const records = initialProducts.map(p => ({
      legacy_id: typeof p.id === 'number' ? p.id : null,
      name: p.name,
      slug: (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + (p.id || Date.now()),
      description: p.description || '',
      price: p.price || 0,
      original_price: p.originalPrice || null,
      category_name: p.category || '',
      subcategory_name: p.subcategory || '',
      brand_name: p.brand || '',
      image: p.image || '',
      gallery: p.gallery || [],
      colors: p.colors || [],
      specs: p.specs || {},
      stock: p.stock ?? 10,
      in_stock: p.inStock ?? true,
      is_bestseller: p.isBestseller ?? false,
      is_hot_deal: p.isHotDeal ?? false,
      is_new: p.isNew ?? true,
      rating: p.rating || 5.0,
      reviews_count: p.reviews || 0
    }));

    const { error } = await supabase.from('products').insert(records);
    if (!error) {
      console.log('[Supabase] Initial catalog successfully seeded to Supabase!');
    }
  } catch (e) {
    console.warn('[Supabase] Seeding skipped or table not yet created.');
  }
}

export async function createProductInSupabase(prod) {
  try {
    const record = {
      legacy_id: Date.now(),
      name: prod.name,
      slug: (prod.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      description: prod.description || '',
      price: prod.price || 0,
      original_price: prod.originalPrice || null,
      category_name: prod.category || '',
      subcategory_name: prod.subcategory || '',
      brand_name: prod.brand || '',
      image: prod.image || '',
      gallery: prod.gallery || [],
      colors: prod.colors || [],
      specs: prod.specs || {},
      stock: prod.stock ?? 10,
      in_stock: prod.inStock ?? true,
      is_bestseller: prod.isBestseller ?? false,
      is_hot_deal: prod.isHotDeal ?? false,
      is_new: prod.isNew ?? true,
      rating: prod.rating || 5.0,
      reviews_count: 0
    };

    const { data, error } = await supabase.from('products').insert([record]).select();
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('[Supabase] createProduct error:', err);
    return null;
  }
}

// ==========================================
// 2. CATEGORIES SYNC & CRUD
// ==========================================

export async function fetchCategoriesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem('SWEETOS_categories', JSON.stringify(data));
      return data;
    }
  } catch (e) {}
  return null;
}

// ==========================================
// 3. BRANDS SYNC & CRUD
// ==========================================

export async function fetchBrandsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem('SWEETOS_brands', JSON.stringify(data));
      return data;
    }
  } catch (e) {}
  return null;
}

// ==========================================
// 4. ORDERS CREATION & SYNC
// ==========================================

export async function createOrderInSupabase(orderData) {
  try {
    const orderRecord = {
      order_number: orderData.orderNumber || 'SW-' + Math.floor(100000 + Math.random() * 900000),
      customer_name: orderData.customerName || orderData.customer?.name || 'Customer',
      customer_email: orderData.customerEmail || orderData.customer?.email || '',
      customer_phone: orderData.customerPhone || orderData.customer?.phone || '',
      customer_address: orderData.address || orderData.shippingAddress || {},
      total_amount: orderData.totalAmount || orderData.total || 0,
      currency: orderData.currency || 'FCFA',
      discount_amount: orderData.discount || 0,
      coupon_code: orderData.coupon || '',
      status: 'pending',
      payment_method: orderData.paymentMethod || 'cash_on_delivery',
      payment_status: orderData.paymentStatus || 'unpaid',
      shipping_notes: orderData.notes || ''
    };

    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select();

    if (orderErr) throw orderErr;

    const orderId = insertedOrder?.[0]?.id;

    if (orderId && Array.isArray(orderData.items) && orderData.items.length > 0) {
      const itemRecords = orderData.items.map(item => ({
        order_id: orderId,
        product_name: item.name || item.title || 'Product',
        unit_price: item.price || 0,
        quantity: item.quantity || 1,
        selected_color: item.selectedColor || item.color || '',
        item_image: item.image || '',
        total_price: (item.price || 0) * (item.quantity || 1)
      }));

      await supabase.from('order_items').insert(itemRecords);
    }

    return insertedOrder?.[0];
  } catch (err) {
    console.error('[Supabase] createOrder error:', err);
    return null;
  }
}

export async function fetchOrdersFromSupabase(userEmail = null) {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (userEmail) {
      query = query.eq('customer_email', userEmail);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[Supabase] fetchOrders error:', err);
    return [];
  }
}

// ==========================================
// 5. GLOBAL INITIALIZATION & REALTIME
// ==========================================

export async function initSupabaseSync() {
  console.log('[Supabase] Connected to project:', SUPABASE_URL);
  
  Promise.allSettled([
    fetchProductsFromSupabase(),
    fetchCategoriesFromSupabase(),
    fetchBrandsFromSupabase()
  ]).then(() => {
    window.dispatchEvent(new CustomEvent('supabase:ready'));
  });
}
