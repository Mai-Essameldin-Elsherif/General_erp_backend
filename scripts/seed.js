import pg from 'pg';
import bcrypt from 'bcrypt';

const client = new pg.Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mai2005',
  database: process.env.DB_DATABASE || 'general_erp_db',
});

async function runSeed() {
  console.log('🚀 Connecting to PostgreSQL database general_erp_db...');
  await client.connect();
  console.log('✅ Connected successfully!');

  const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. COMPANIES
  console.log('🌱 Seeding companies...');
  await client.query(`
    INSERT INTO companies (id, name, tax_number) VALUES
      (1, 'Acme Enterprise Holdings', 'TAX-EG-102938'),
      (2, 'Apex Global Logistics LLC', 'TAX-UAE-849201'),
      (3, 'Horizon Retail Ventures', 'TAX-KSA-774910')
    ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name, tax_number = EXCLUDED.tax_number;
  `);

  // 2. ORGANIZATIONS
  console.log('🌱 Seeding organizations...');
  await client.query(`
    INSERT INTO organizations (id, name, code, "taxNumber", address) VALUES
      ('c6ac83f6-2eb6-4174-8bd9-15c7e4830873', 'General ERP Corp', 'ERP-HQ', '123-456-789', 'Smart Village, Building B4, Cairo, Egypt'),
      ('fd21bfe7-ad67-4562-834f-fbf94e98a912', 'Middle East Trading Co.', 'MET-01', '890-123-567', 'Corniche Road, Alexandria, Egypt')
    ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name, code = EXCLUDED.code, "taxNumber" = EXCLUDED."taxNumber", address = EXCLUDED.address;
  `);

  // 3. BRANCHES
  console.log('🌱 Seeding branches...');
  await client.query(`
    INSERT INTO branches (id, name, location, "isActive", company_id) VALUES
      (1, 'Main Branch', 'Cairo Headquarters, Smart Village', true, 1),
      (2, 'Alexandria Branch', 'Smouha Logistics Center, Alexandria', true, 1),
      (3, 'Giza Operations Hub', '6th of October Industrial District, Giza', true, 1),
      (4, 'Dubai Regional Office', 'Business Bay Tower, Dubai, UAE', true, 2),
      (5, 'Riyadh Business Gate', 'King Fahd Road, Riyadh, KSA', true, 3)
    ON CONFLICT (name) DO UPDATE
    SET location = EXCLUDED.location, "isActive" = EXCLUDED."isActive", company_id = EXCLUDED.company_id;
  `);

  // 4. DEPARTMENTS
  console.log('🌱 Seeding departments...');
  await client.query(`
    INSERT INTO departments (id, name, description, branch_id) VALUES
      (1, 'Human Resources', 'Talent acquisition, organizational development and employee payroll', 1),
      (2, 'Finance & Accounting', 'Corporate accounting, general ledger, audits and financial governance', 1),
      (3, 'Information Technology', 'Enterprise cloud infrastructure, cybersecurity and internal systems', 1),
      (4, 'Sales & Marketing', 'Enterprise customer growth, client accounts and market development', 2),
      (5, 'Supply Chain & Logistics', 'Global procurement, distribution hubs and inventory management', 3),
      (6, 'Customer Success & Support', 'Client onboarding, service level agreements and support operations', 4),
      (7, 'Research & Development', 'ERP product engineering, architecture and automated innovations', 1)
    ON CONFLICT (name) DO UPDATE
    SET description = EXCLUDED.description, branch_id = EXCLUDED.branch_id;
  `);

  // 5. ROLES
  console.log('🌱 Seeding roles...');
  await client.query(`
    INSERT INTO roles (id, name, description) VALUES
      (1, 'Finance Manager', 'Full management of billing, invoices, chart of accounts and journal entries'),
      (2, 'Super Admin', 'Unrestricted administrative access to all modules, settings and audit trail'),
      (3, 'HR Specialist', 'Manages employee records, departments, hiring processes and teams'),
      (4, 'Branch Supervisor', 'Oversees local branch staff, warehouse stock levels and operations'),
      (5, 'General Staff', 'Standard operational access for transactional duties and order processing'),
      (6, 'Inventory Auditor', 'Specialized access for stock reconciliation and warehouse verification'),
      (7, 'Sales Director', 'Manages enterprise clients, sales orders, quotes and contract terms')
    ON CONFLICT (name) DO UPDATE
    SET description = EXCLUDED.description;
  `);

  // 6. PERMISSIONS
  console.log('🌱 Seeding permissions...');
  await client.query(`
    INSERT INTO permissions (name, description) VALUES
      ('read:reports', 'View analytical reports and financial metrics'),
      ('read:users', 'View user profiles and organizational directory'),
      ('write:users', 'Create and modify user accounts and roles'),
      ('delete:users', 'Deactivate and delete user accounts'),
      ('manage:branches', 'Manage branch offices and logistics centers'),
      ('manage:inventory', 'Manage product catalog, warehouses and stock levels'),
      ('manage:finance', 'Manage general ledger, invoices and payments'),
      ('view:audit_logs', 'Access system security trail and historical audit logs')
    ON CONFLICT (name) DO NOTHING;
  `);

  // 7. ROLE_PERMISSIONS
  console.log('🌱 Seeding role_permissions...');
  for (let rId = 1; rId <= 5; rId++) {
    for (let pId = 1; pId <= 5; pId++) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `, [rId, pId]);
    }
  }

  // 8. USERS (Preserving existing, inserting realistic ERP users from prototype)
  console.log('🌱 Seeding users...');
  const usersToSeed = [
    { email: 'sarah.j@enterprise.com', firstName: 'Sarah', lastName: 'Jenkins', role: 'admin', isActive: true },
    { email: 'm.chen@enterprise.com', firstName: 'Michael', lastName: 'Chen', role: 'manager', isActive: true },
    { email: 'e.rodriguez@enterprise.com', firstName: 'Emily', lastName: 'Rodriguez', role: 'staff', isActive: true },
    { email: 'd.kim@enterprise.com', firstName: 'David', lastName: 'Kim', role: 'manager', isActive: true },
    { email: 'j.taylor@enterprise.com', firstName: 'Jessica', lastName: 'Taylor', role: 'staff', isActive: false },
    { email: 'a.martinez@enterprise.com', firstName: 'Alex', lastName: 'Martinez', role: 'staff', isActive: true },
    { email: 'j.wilson@enterprise.com', firstName: 'James', lastName: 'Wilson', role: 'admin', isActive: true },
    { email: 'a.lewis@enterprise.com', firstName: 'Amanda', lastName: 'Lewis', role: 'staff', isActive: true }
  ];

  for (const u of usersToSeed) {
    await client.query(`
      INSERT INTO users (email, "passwordHash", "firstName", "lastName", role, "isActive")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE
      SET "firstName" = EXCLUDED."firstName",
          "lastName" = EXCLUDED."lastName",
          role = EXCLUDED.role,
          "isActive" = EXCLUDED."isActive";
    `, [u.email, defaultPasswordHash, u.firstName, u.lastName, u.role, u.isActive]);
  }

  // Fetch created users to link to user_roles and employees
  const dbUsers = (await client.query('SELECT id, email, role FROM users')).rows;
  const userMap = {};
  dbUsers.forEach(u => { userMap[u.email] = u; });

  // 9. USER_ROLES
  console.log('🌱 Seeding user_roles...');
  const roleMapping = [
    { email: 'admin3@erp.com', roleId: 2 },
    { email: 'admin2@erp.com', roleId: 2 },
    { email: 'admin@erp.com', roleId: 2 },
    { email: 'sarah.j@enterprise.com', roleId: 2 },
    { email: 'm.chen@enterprise.com', roleId: 1 },
    { email: 'e.rodriguez@enterprise.com', roleId: 6 },
    { email: 'd.kim@enterprise.com', roleId: 7 },
    { email: 'j.taylor@enterprise.com', roleId: 3 },
    { email: 'a.martinez@enterprise.com', roleId: 4 },
    { email: 'j.wilson@enterprise.com', roleId: 2 },
    { email: 'a.lewis@enterprise.com', roleId: 3 },
  ];

  for (const m of roleMapping) {
    if (userMap[m.email]) {
      await client.query(`
        INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `, [userMap[m.email].id, m.roleId]);
    }
  }

  // 10. EMPLOYEES
  console.log('🌱 Seeding employees...');
  const employeesData = [
    { email: 'sarah.j@enterprise.com', deptId: 3, jobTitle: 'Lead Enterprise Architect', salary: 9500.00, hireDate: '2023-01-15' },
    { email: 'm.chen@enterprise.com', deptId: 2, jobTitle: 'Senior Financial Analyst', salary: 7800.00, hireDate: '2023-04-01' },
    { email: 'e.rodriguez@enterprise.com', deptId: 2, jobTitle: 'Compliance & Internal Auditor', salary: 6500.00, hireDate: '2023-07-10' },
    { email: 'd.kim@enterprise.com', deptId: 4, jobTitle: 'Regional Sales Director', salary: 8200.00, hireDate: '2023-09-01' },
    { email: 'j.taylor@enterprise.com', deptId: 1, jobTitle: 'Talent Acquisition Associate', salary: 4800.00, hireDate: '2024-02-15' },
    { email: 'a.martinez@enterprise.com', deptId: 5, jobTitle: 'Logistics Coordinator', salary: 5200.00, hireDate: '2024-03-20' },
    { email: 'j.wilson@enterprise.com', deptId: 3, jobTitle: 'DevOps & Security Lead', salary: 8900.00, hireDate: '2023-03-01' },
    { email: 'a.lewis@enterprise.com', deptId: 1, jobTitle: 'HR Operations Generalist', salary: 5400.00, hireDate: '2024-05-10' },
  ];

  for (const emp of employeesData) {
    if (userMap[emp.email]) {
      const existing = await client.query('SELECT id FROM employees WHERE user_id = $1', [userMap[emp.email].id]);
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO employees (user_id, department_id, job_title, salary, hire_date)
          VALUES ($1, $2, $3, $4, $5);
        `, [userMap[emp.email].id, emp.deptId, emp.jobTitle, emp.salary, emp.hireDate]);
      } else {
        await client.query(`
          UPDATE employees 
          SET department_id = $2, job_title = $3, salary = $4, hire_date = $5
          WHERE user_id = $1;
        `, [userMap[emp.email].id, emp.deptId, emp.jobTitle, emp.salary, emp.hireDate]);
      }
    }
  }

  // 11. PRODUCT CATEGORIES
  console.log('🌱 Seeding product_categories...');
  await client.query(`
    INSERT INTO product_categories (id, name, parent_id) VALUES
      (1, 'Enterprise Hardware & Servers', null),
      (2, 'Networking & Telecommunications', null),
      (3, 'Office & Ergonomic Furniture', null),
      (4, 'Industrial Machinery & Equipment', null),
      (5, 'Security & Surveillance Systems', null),
      (6, 'Software Licenses & Subscriptions', null)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name;
  `);

  // 12. PRODUCTS
  console.log('🌱 Seeding products...');
  const productsList = [
    { sku: 'PRD-SRV-001', barcode: '890100200301', name: 'Dell PowerEdge R750 Server', desc: 'Dual Xeon 32-core, 128GB RAM, 4TB NVMe SSD Enterprise Rack Server', unit_price: 5200.00, cost_price: 3800.00, reorder_level: 5, category_id: 1 },
    { sku: 'PRD-WS-002', barcode: '890100200302', name: 'ThinkPad P16 Gen 2 Workstation', desc: 'Core i9, 64GB DDR5, RTX 4080, 2TB SSD Mobile Engineering Workstation', unit_price: 2850.00, cost_price: 2100.00, reorder_level: 8, category_id: 1 },
    { sku: 'PRD-SW-003', barcode: '890100200303', name: 'Cisco Catalyst 9300 48P PoE+', desc: '48-Port Gigabit Managed Network Switch with Layer 3 Routing Capabilities', unit_price: 2100.00, cost_price: 1450.00, reorder_level: 6, category_id: 2 },
    { sku: 'PRD-FW-004', barcode: '890100200304', name: 'Fortinet FortiGate 100F Firewall', desc: 'Next-Generation Firewall with 1 Gbps Threat Protection throughput', unit_price: 3400.00, cost_price: 2400.00, reorder_level: 4, category_id: 2 },
    { sku: 'PRD-CHR-005', barcode: '890100200305', name: 'Steelcase Gesture Ergonomic Chair', desc: 'Premium executive ergonomic task chair with 3D liveback lumbar support', unit_price: 1150.00, cost_price: 720.00, reorder_level: 10, category_id: 3 },
    { sku: 'PRD-DSK-006', barcode: '890100200306', name: 'Executive Dual-Motor Standing Desk', desc: '180x80cm solid oak surface with electric memory height presets', unit_price: 850.00, cost_price: 530.00, reorder_level: 8, category_id: 3 },
    { sku: 'PRD-CAM-007', barcode: '890100200307', name: 'Axis 4K PTZ Surveillance Camera', desc: 'Ultra HD 360-degree IP security camera with night vision and AI analytics', unit_price: 1450.00, cost_price: 980.00, reorder_level: 12, category_id: 5 },
    { sku: 'PRD-PRN-008', barcode: '890100200308', name: 'Zebra ZT411 Industrial RFID Printer', desc: 'Heavy-duty industrial thermal transfer label and barcode printer', unit_price: 1750.00, cost_price: 1190.00, reorder_level: 5, category_id: 4 }
  ];

  for (const p of productsList) {
    await client.query(`
      INSERT INTO products (sku, barcode, name, description, unit_price, cost_price, reorder_level, is_active, category_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
      ON CONFLICT (sku) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description, unit_price = EXCLUDED.unit_price, cost_price = EXCLUDED.cost_price;
    `, [p.sku, p.barcode, p.name, p.desc, p.unit_price, p.cost_price, p.reorder_level, p.category_id]);
  }

  const dbProducts = (await client.query('SELECT id, sku FROM products')).rows;
  const productMap = {};
  dbProducts.forEach(p => { productMap[p.sku] = p; });

  // 13. WAREHOUSES
  console.log('🌱 Seeding warehouses...');
  await client.query(`
    INSERT INTO warehouses (id, branch_id, name, location) VALUES
      (1, 1, 'Main Logistics Hub - Cairo', 'Zone A, 6th of October Industrial City, Cairo'),
      (2, 2, 'Alexandria Freezone Depot', 'Borg El Arab Logistics Complex, Alexandria'),
      (3, 3, 'Giza Central Fulfillment Center', 'Smart Village Logistics Park, Giza'),
      (4, 4, 'Dubai JAFZA Hub', 'Jebel Ali Free Zone, South Warehouse 12, Dubai')
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, location = EXCLUDED.location;
  `);

  // 14. STOCK LEVELS
  console.log('🌱 Seeding stock_levels...');
  for (const p of dbProducts) {
    for (let wId = 1; wId <= 4; wId++) {
      await client.query(`
        INSERT INTO stock_levels (product_id, warehouse_id, qty_on_hand, qty_reserved)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (product_id, warehouse_id) DO UPDATE
        SET qty_on_hand = EXCLUDED.qty_on_hand, qty_reserved = EXCLUDED.qty_reserved;
      `, [p.id, wId, 25 + (wId * 10), 2 + wId]);
    }
  }

  // 15. STOCK MOVEMENTS
  console.log('🌱 Seeding stock_movements...');
  const existingMovements = await client.query('SELECT count(*) FROM stock_movements');
  if (parseInt(existingMovements.rows[0].count, 10) === 0) {
    for (const p of dbProducts.slice(0, 4)) {
      await client.query(`
        INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, reference_type)
        VALUES 
          ($1, 1, 'INBOUND', 50, 'PURCHASE_RECEIPT'),
          ($1, 1, 'OUTBOUND', 5, 'SALES_DISPATCH'),
          ($1, 2, 'TRANSFER', 10, 'INTER_WAREHOUSE');
      `, [p.id]);
    }
  }

  // 16. VENDORS
  console.log('🌱 Seeding vendors...');
  const vendorsData = [
    { name: 'Cisco Systems Middle East', contact: 'Omar Farooq', phone: '+20 100 234 5678', email: 'supplies@cisco-me.com' },
    { name: 'Dell Technologies Direct', contact: 'Linda Meyer', phone: '+20 102 345 6789', email: 'enterprise@dell.com' },
    { name: 'Steelcase Workplace Solutions', contact: 'Karim Zaki', phone: '+971 4 555 1234', email: 'orders@steelcase-me.com' },
    { name: 'Fortinet EMEA Distribution', contact: 'Sarah Al-Ghamdi', phone: '+966 11 444 7890', email: 'distribution@fortinet.com' }
  ];

  for (const v of vendorsData) {
    const existing = await client.query('SELECT id FROM vendors WHERE company_name = $1', [v.name]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO vendors (company_name, contact_name, phone, email)
        VALUES ($1, $2, $3, $4);
      `, [v.name, v.contact, v.phone, v.email]);
    }
  }

  const dbVendors = (await client.query('SELECT id, company_name FROM vendors')).rows;

  // 17. PURCHASE ORDERS & ITEMS
  console.log('🌱 Seeding purchase_orders & items...');
  const poList = [
    { number: 'PO-2026-001', vendorIdx: 0, branchId: 1, status: 'COMPLETED', cost: 26400.00, delivery: '2026-09-20' },
    { number: 'PO-2026-002', vendorIdx: 1, branchId: 2, status: 'APPROVED', cost: 14500.00, delivery: '2026-10-25' },
    { number: 'PO-2026-003', vendorIdx: 2, branchId: 3, status: 'DRAFT', cost: 8900.00, delivery: '2026-11-05' }
  ];

  for (const po of poList) {
    const vId = dbVendors[po.vendorIdx]?.id || dbVendors[0].id;
    await client.query(`
      INSERT INTO purchase_orders (po_number, vendor_id, branch_id, status, total_cost, expected_delivery_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (po_number) DO UPDATE
      SET status = EXCLUDED.status, total_cost = EXCLUDED.total_cost;
    `, [po.number, vId, po.branchId, po.status, po.cost, po.delivery]);

    const createdPo = (await client.query('SELECT id FROM purchase_orders WHERE po_number = $1', [po.number])).rows[0];
    const existingItems = await client.query('SELECT id FROM purchase_order_items WHERE purchase_order_id = $1', [createdPo.id]);
    if (existingItems.rows.length === 0 && dbProducts.length > 0) {
      await client.query(`
        INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
        VALUES 
          ($1, $2, 4, 3800.00),
          ($1, $3, 8, 1450.00);
      `, [createdPo.id, dbProducts[0].id, dbProducts[1]?.id || dbProducts[0].id]);
    }
  }

  // 18. CUSTOMERS
  console.log('🌱 Seeding customers...');
  const customersData = [
    { name: 'Vodafone Enterprise Services', email: 'procurement@vodafone.eg', phone: '+20 100 000 1111', credit_limit: 150000.00 },
    { name: 'Commercial International Bank (CIB)', email: 'it.operations@cibeg.com', phone: '+20 101 222 3333', credit_limit: 300000.00 },
    { name: 'Emaar Properties PJSC', email: 'supplychain@emaar.ae', phone: '+971 4 367 3333', credit_limit: 500000.00 },
    { name: 'Etisalat by e&', email: 'enterprise@etisalat.ae', phone: '+971 2 618 4444', credit_limit: 250000.00 },
    { name: 'Banque Misr Corporate Banking', email: 'vendors@banquemisr.com', phone: '+20 109 888 7777', credit_limit: 200000.00 }
  ];

  for (const c of customersData) {
    const existing = await client.query('SELECT id FROM customers WHERE email = $1', [c.email]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO customers (name, email, phone, credit_limit)
        VALUES ($1, $2, $3, $4);
      `, [c.name, c.email, c.phone, c.credit_limit]);
    }
  }

  const dbCustomers = (await client.query('SELECT id, name, email FROM customers')).rows;
  const adminUserId = dbUsers.find(u => u.email === 'admin3@erp.com')?.id || dbUsers[0].id;

  // 19. SALES ORDERS, ITEMS, INVOICES & PAYMENTS
  console.log('🌱 Seeding sales_orders, items, invoices, and payments...');
  const salesOrdersData = [
    { number: 'SO-2026-101', customerIdx: 0, branchId: 1, status: 'COMPLETED', payStatus: 'PAID', amount: 24567.00, invNumber: 'INV-2026-101', tax: 3439.38, invStatus: 'PAID', payMethod: 'BANK_TRANSFER' },
    { number: 'SO-2026-102', customerIdx: 1, branchId: 1, status: 'PROCESSING', payStatus: 'PARTIAL', amount: 18450.00, invNumber: 'INV-2026-102', tax: 2583.00, invStatus: 'PARTIAL', payMethod: 'CREDIT_CARD' },
    { number: 'SO-2026-103', customerIdx: 2, branchId: 4, status: 'COMPLETED', payStatus: 'PAID', amount: 32100.00, invNumber: 'INV-2026-103', tax: 4494.00, invStatus: 'PAID', payMethod: 'WIRE_TRANSFER' },
    { number: 'SO-2026-104', customerIdx: 3, branchId: 2, status: 'DELIVERED', payStatus: 'PAID', amount: 14200.00, invNumber: 'INV-2026-104', tax: 1988.00, invStatus: 'PAID', payMethod: 'BANK_TRANSFER' },
    { number: 'SO-2026-105', customerIdx: 4, branchId: 3, status: 'PENDING', payStatus: 'UNPAID', amount: 9800.00, invNumber: 'INV-2026-105', tax: 1372.00, invStatus: 'ISSUED', payMethod: 'CHEQUE' },
  ];

  for (const so of salesOrdersData) {
    const cId = dbCustomers[so.customerIdx]?.id || dbCustomers[0].id;

    await client.query(`
      INSERT INTO sales_orders (order_number, customer_id, branch_id, created_by, status, payment_status, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (order_number) DO UPDATE
      SET status = EXCLUDED.status, payment_status = EXCLUDED.payment_status, total_amount = EXCLUDED.total_amount;
    `, [so.number, cId, so.branchId, adminUserId, so.status, so.payStatus, so.amount]);

    const createdSo = (await client.query('SELECT id FROM sales_orders WHERE order_number = $1', [so.number])).rows[0];

    // Sales Order Items
    const existingItems = await client.query('SELECT id FROM sales_order_items WHERE sales_order_id = $1', [createdSo.id]);
    if (existingItems.rows.length === 0 && dbProducts.length > 0) {
      await client.query(`
        INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, discount)
        VALUES 
          ($1, $2, 3, 5200.00, 5.00),
          ($1, $3, 5, 1850.00, 0.00);
      `, [createdSo.id, dbProducts[0].id, dbProducts[2]?.id || dbProducts[0].id]);
    }

    // Invoices
    await client.query(`
      INSERT INTO invoices (invoice_number, sales_order_id, due_date, status, payment_method, total_amount, tax_amount)
      VALUES ($1, $2, '2026-11-15', $3, $4, $5, $6)
      ON CONFLICT (invoice_number) DO UPDATE
      SET status = EXCLUDED.status, total_amount = EXCLUDED.total_amount;
    `, [so.invNumber, createdSo.id, so.invStatus, so.payMethod, so.amount, so.tax]);

    const createdInv = (await client.query('SELECT id FROM invoices WHERE invoice_number = $1', [so.invNumber])).rows[0];

    // Payments
    if (so.invStatus === 'PAID' || so.invStatus === 'PARTIAL') {
      const payAmount = so.invStatus === 'PAID' ? so.amount : Math.round(so.amount / 2);
      const existingPay = await client.query('SELECT id FROM payments WHERE invoice_id = $1', [createdInv.id]);
      if (existingPay.rows.length === 0) {
        await client.query(`
          INSERT INTO payments (invoice_id, amount, payment_method)
          VALUES ($1, $2, $3);
        `, [createdInv.id, payAmount, so.payMethod]);
      }
    }
  }

  // 20. CHART OF ACCOUNTS
  console.log('🌱 Seeding chart_of_accounts...');
  const coaData = [
    { code: '1010', name: 'Cash on Hand & Central Bank Accounts', type: 'ASSET' },
    { code: '1020', name: 'Accounts Receivable - Enterprise Trade', type: 'ASSET' },
    { code: '1050', name: 'Merchandise & Hardware Inventory', type: 'ASSET' },
    { code: '1080', name: 'Property, Plant & Warehouse Equipment', type: 'ASSET' },
    { code: '2010', name: 'Accounts Payable - Vendors & Suppliers', type: 'LIABILITY' },
    { code: '2030', name: 'Accrued Corporate Taxes & VAT Payable', type: 'LIABILITY' },
    { code: '3010', name: 'Share Capital & Retained Earnings', type: 'EQUITY' },
    { code: '4010', name: 'Commercial Enterprise Sales Revenue', type: 'REVENUE' },
    { code: '4020', name: 'Consulting & Maintenance Services Revenue', type: 'REVENUE' },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE' },
    { code: '6010', name: 'Employee Salaries, Bonuses & Benefits', type: 'EXPENSE' },
    { code: '6020', name: 'Office Facilities, Cloud Hosting & Utilities', type: 'EXPENSE' }
  ];

  for (const acc of coaData) {
    await client.query(`
      INSERT INTO chart_of_accounts (code, name, account_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name, account_type = EXCLUDED.account_type;
    `, [acc.code, acc.name, acc.type]);
  }

  const dbCoa = (await client.query('SELECT id, code FROM chart_of_accounts')).rows;
  const coaMap = {};
  dbCoa.forEach(c => { coaMap[c.code] = c.id; });

  // 21. JOURNAL ENTRIES & ITEMS
  console.log('🌱 Seeding journal_entries & items...');
  const jeData = [
    {
      entry_number: 'JE-2026-001',
      date: '2026-10-01',
      desc: 'Opening fiscal quarter balances & capitalization',
      items: [
        { code: '1010', debit: 250000.00, credit: 0.00 },
        { code: '1050', debit: 180000.00, credit: 0.00 },
        { code: '3010', debit: 0.00, credit: 430000.00 }
      ]
    },
    {
      entry_number: 'JE-2026-002',
      date: '2026-10-10',
      desc: 'Enterprise hardware inventory procurement',
      items: [
        { code: '1050', debit: 45000.00, credit: 0.00 },
        { code: '2010', debit: 0.00, credit: 45000.00 }
      ]
    },
    {
      entry_number: 'JE-2026-003',
      date: '2026-10-18',
      desc: 'Enterprise client invoice settlement & cash collection',
      items: [
        { code: '1010', debit: 24567.00, credit: 0.00 },
        { code: '4010', debit: 0.00, credit: 24567.00 }
      ]
    },
    {
      entry_number: 'JE-2026-004',
      date: '2026-10-20',
      desc: 'Monthly operations payroll and office facilities settlement',
      items: [
        { code: '6010', debit: 38000.00, credit: 0.00 },
        { code: '6020', debit: 12500.00, credit: 0.00 },
        { code: '1010', debit: 0.00, credit: 50500.00 }
      ]
    }
  ];

  for (const je of jeData) {
    await client.query(`
      INSERT INTO journal_entries (entry_number, entry_date, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (entry_number) DO UPDATE
      SET description = EXCLUDED.description;
    `, [je.entry_number, je.date, je.desc]);

    const createdJe = (await client.query('SELECT id FROM journal_entries WHERE entry_number = $1', [je.entry_number])).rows[0];
    const existingItems = await client.query('SELECT id FROM journal_items WHERE journal_entry_id = $1', [createdJe.id]);

    if (existingItems.rows.length === 0) {
      for (const it of je.items) {
        const accId = coaMap[it.code];
        if (accId) {
          await client.query(`
            INSERT INTO journal_items (journal_entry_id, account_id, debit, credit)
            VALUES ($1, $2, $3, $4);
          `, [createdJe.id, accId, it.debit, it.credit]);
        }
      }
    }
  }

  // 22. AUDIT LOGS (Add realistic entries)
  console.log('🌱 Seeding audit_logs...');
  const auditLogsToInsert = [
    { action: 'USER_REGISTERED', details: 'Added new team member Sarah Jenkins (sarah.j@enterprise.com) as Admin' },
    { action: 'ROLE_ASSIGNED', details: 'Assigned Super Admin role privileges to user admin3@erp.com' },
    { action: 'BRANCH_UPDATED', details: 'Updated branch configuration for Alexandria Logistics Center' },
    { action: 'INVENTORY_AUDIT', details: 'Verified physical stock counts across Zone A and Borg El Arab warehouses' },
    { action: 'SALES_ORDER_CONFIRMED', details: 'Confirmed Enterprise Sales Order SO-2026-101 for Vodafone Enterprise' },
    { action: 'INVOICE_GENERATED', details: 'Generated commercial invoice INV-2026-101 for $24,567.00 with VAT' },
    { action: 'PAYMENT_RECEIVED', details: 'Recorded bank transfer settlement of $24,567.00 for invoice INV-2026-101' },
    { action: 'SECURITY_SCAN', details: 'Automated role-based access control and token validation check passed' }
  ];

  for (const log of auditLogsToInsert) {
    const existing = await client.query('SELECT id FROM audit_logs WHERE details = $1', [log.details]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO audit_logs ("userId", action, details, "createdAt")
        VALUES ($1, $2, $3, NOW() - (INTERVAL '1 hour' * floor(random() * 48)));
      `, [adminUserId, log.action, log.details]);
    }
  }

  console.log('🎉 Seeding completed successfully! Verifying table counts...');
  const tables = (await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `)).rows;

  for (const t of tables) {
    const cnt = (await client.query(`SELECT count(*) FROM "${t.table_name}"`)).rows[0].count;
    console.log(`   📊 ${t.table_name.padEnd(25)} : ${cnt} rows`);
  }

  await client.end();
  console.log('✨ All done! PostgreSQL general_erp_db is fully populated.');
}

runSeed().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
