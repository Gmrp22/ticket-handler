const path = require('path');
const ExcelJS = require('exceljs');
const { Sequelize, QueryTypes } = require('sequelize');
const config = require('../config/config').development;

const EXCEL_PATH = path.join(__dirname, '../../data/tickets-prueba.xlsx');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: false,
});

const readRows = async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.worksheets[0];

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const [ticketCode, date, supplierCode, supplierName, landCode, landName, productCode, productName, quantity, price] =
      row.values.slice(1);

    rows.push({
      ticketCode: String(ticketCode),
      date: date.toISOString().slice(0, 10),
      supplier: { code: supplierCode, name: supplierName },
      land: { code: landCode, name: landName },
      product: { code: productCode, name: productName },
      quantity,
      price,
    });
  });

  return rows;
};

const uniqueByCode = (items) => [...new Map(items.map((item) => [item.code, item])).values()];

const insertCatalog = async (table, items, transaction) => {
  const now = new Date();
  const values = items.map((item) => ({ ...item, created_at: now, updated_at: now }));
  await sequelize.getQueryInterface().bulkInsert(table, values, { transaction });

  const saved = await sequelize.query(`SELECT id, code FROM ${table}`, { type: QueryTypes.SELECT, transaction });
  return new Map(saved.map((item) => [item.code, item.id]));
};

const run = async () => {
  const rows = await readRows();

  const [{ count }] = await sequelize.query('SELECT COUNT(*)::int AS count FROM tickets', { type: QueryTypes.SELECT });
  if (count > 0) {
    throw new Error('The database already has data. Import canceled.');
  }

  await sequelize.transaction(async (transaction) => {
    const suppliers = await insertCatalog('suppliers', uniqueByCode(rows.map((row) => row.supplier)), transaction);
    const lands = await insertCatalog('lands', uniqueByCode(rows.map((row) => row.land)), transaction);
    const products = await insertCatalog('products', uniqueByCode(rows.map((row) => row.product)), transaction);

    const now = new Date();
    const ticketsByCode = new Map();
    rows.forEach((row) => {
      if (ticketsByCode.has(row.ticketCode)) return;
      ticketsByCode.set(row.ticketCode, {
        code: row.ticketCode,
        date: row.date,
        supplier_id: suppliers.get(row.supplier.code),
        land_id: lands.get(row.land.code),
        created_at: now,
        updated_at: now,
      });
    });
    await sequelize.getQueryInterface().bulkInsert('tickets', [...ticketsByCode.values()], { transaction });

    const savedTickets = await sequelize.query('SELECT id, code FROM tickets', { type: QueryTypes.SELECT, transaction });
    const tickets = new Map(savedTickets.map((ticket) => [ticket.code, ticket.id]));

    const items = rows.map((row) => ({
      ticket_id: tickets.get(row.ticketCode),
      product_id: products.get(row.product.code),
      quantity: row.quantity,
      price: row.price,
      created_at: now,
      updated_at: now,
    }));
    await sequelize.getQueryInterface().bulkInsert('ticket_items', items, { transaction });

    console.log(
      `Imported: ${suppliers.size} suppliers, ${lands.size} lands, ${products.size} products, ${tickets.size} tickets, ${items.length} items`,
    );
  });
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
