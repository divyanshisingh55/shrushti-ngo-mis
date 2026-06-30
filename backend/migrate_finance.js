require("dotenv").config();
const pool = require("./src/config/db");

async function createFinanceTable() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS finance_records (
        id SERIAL PRIMARY KEY,
        year VARCHAR(10) NOT NULL UNIQUE,
        income NUMERIC(20, 2) DEFAULT 0,
        expenditure NUMERIC(20, 2) DEFAULT 0,
        surplus NUMERIC(20, 2) DEFAULT 0,
        turnover NUMERIC(20, 2) DEFAULT 0,
        total_assets NUMERIC(20, 2) DEFAULT 0,
        total_liabilities NUMERIC(20, 2) DEFAULT 0,
        networth NUMERIC(20, 2) DEFAULT 0,
        grant_received_total NUMERIC(20, 2) DEFAULT 0,
        grant_received_govt NUMERIC(20, 2) DEFAULT 0,
        grant_received_csr NUMERIC(20, 2) DEFAULT 0,
        grant_received_funding_agency NUMERIC(20, 2) DEFAULT 0,
        grant_received_fcra NUMERIC(20, 2) DEFAULT 0,
        grant_in_aid_total NUMERIC(20, 2) DEFAULT 0,
        grant_in_aid_govt NUMERIC(20, 2) DEFAULT 0,
        grant_in_aid_csr NUMERIC(20, 2) DEFAULT 0,
        grant_in_aid_funding_agency NUMERIC(20, 2) DEFAULT 0,
        grant_in_aid_fcra NUMERIC(20, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ finance_records table created");

    // Seed data from Excel
    const records = [
      ["1998-99", 0, 2560, -2560, 2560, 52, 0, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["1999-00", 751, 909, -158, 909, 506, 0, 506, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2000-01", 1158, 1949, -791, 1949, 577, 250, 327, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2001-02", 432776, 430121, 2655, 430121, 24474, 20880, 3594, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2002-03", 607682, 604752, 2930, 604752, 35881, 29000, 6881, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2003-04", 480433, 478258.45, 2174.55, 478258.45, 33167.55, 23500, 9667.55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2004-05", 5580338, 5576037.83, 4300.17, 5576037.83, 1880180.72, 1865601, 14579.72, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2005-06", 4331354, 4329497.57, 1856.43, 4329497.57, 1129102.15, 1111901, 17201.15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2006-07", 3995177, 3975852.27, 19324.73, 3975852.27, 1044502.89, 1007365.01, 37137.88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2007-08", 4193455, 4194364.11, -909.11, 4194364.11, 1918259.78, 1881317, 36942.78, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2008-09", 2771231, 2759944.28, 11286.72, 2759944.28, 1322191.5, 1273350, 48841.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2009-10", 1956986, 2313652.85, -356666.85, 2313652.85, 635858.65, 942970, -307111.35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2010-11", 2011752, 1843714.78, 168037.22, 1843714.78, 709276.87, 847688, -138411.13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2011-12", 1910645, 1725730.8, 184914.2, 1725730.8, 1099244.07, 1052129, 47115.07, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2012-13", 3958578, 3815688.31, 142889.69, 3815688.31, 856435.75, 677152, 179283.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["2013-14", 1869883, 1623647.65, 246235.35, 1623647.65, 833501.1, 407982, 425519.1, 1098711, 371561, 0, 0, 727150, 1009511, 311092, 0, 0, 698419],
      ["2014-15", 4631754, 4146064.8, 485689.2, 4146064.8, 1192237.2, 173953.9, 1018283.3, 3554833, 342074, 0, 1085221, 2127538, 3393265, 34500, 0, 1257649, 2101116],
      ["2015-16", 2570952, 2708012.96, -137060.96, 2708012.96, 1135487.34, 217125, 918362.34, 2148793, 0, 0, 776225, 1372568, 1948150, 0, 0, 568556, 1379594],
      ["2016-17", 7266312, 7377619.86, -111307.86, 7377619.86, 2410952.48, 1552830, 858122.48, 7842224, 0, 1000000, 5046756, 1795468, 6769868, 0, 43342, 4809292, 1917234],
      ["2017-18", 39509764.55, 39176628.63, 333135.92, 39176628.63, 6659177.94, 4340818.12, 2318359.82, 38820507, 1578500, 21900000, 13414062, 1927945, 38307087.88, 522725, 21502476.98, 14295573.9, 1986312],
      ["2018-19", 67014228.4, 64047014.37, 2967214.03, 64047014.37, 14726104.37, 8372506.22, 6353598.15, 63056293, 3737372, 37709080, 20073548, 1536293, 61947099.2, 2386709, 37490158.1, 20697519.5, 1372712.6],
      ["2019-20", 64683826.38, 64616950.98, 66875.4, 64616950.98, 19401616.04, 11903803.49, 7497812.55, 61781328.43, 0, 41438199, 18649128.53, 1694000.9, 62329407.58, 3299712, 39606811.75, 17706407.53, 1716476.3],
      ["2020-21", 59256425.4, 58112231.19, 1144194.21, 58642340.4, 24528937.39, 16231829.63, 8297107.76, 55512681.58, 4928675, 39535246, 10065127.58, 983633, 55961857.86, 5290961, 39180026, 9564362.86, 1926508],
      ["2021-22", 92213407.58, 90131517.92, 2081889.66, 90519384.58, 23774130.42, 14498517, 9275613.42, 82174908, 21875528, 41964571, 12017532, 6317277, 89409975.38, 30185205, 42468902, 11885636.38, 4870232],
      ["2022-23", 117685807.64, 113648533.72, 4037273.92, 117614526.64, 34038036.51, 20825896.17, 13212140.34, 119912141, 38979061, 54929079, 19077315, 6926686, 116468609.14, 31666122, 54857520, 22228799.14, 7716168],
      ["2023-24", 143438964.5, 138281220.22, 5157744.28, 143438890.16, 33817542.67, 14366907.05, 19450635.62, 142037257.4, 25929425, 72368457, 28642721.4, 15096654, 142208647.09, 26930412.95, 74673173, 25327503.26, 15277557.88],
      ["2024-25", 127915983.54, 116979577.54, 10936406, 127592731.54, 51174114.56, 20617737.34, 30556377.22, 111638536.95, 16334990.95, 60848145, 21254017, 13201384, 125952446.54, 27817783, 62217133.88, 22732895.66, 13184634],
    ];

    for (const r of records) {
      const [year, income, expenditure, surplus, turnover, total_assets, total_liabilities, networth,
        gr_total, gr_govt, gr_csr, gr_fa, gr_fcra,
        gia_total, gia_govt, gia_csr, gia_fa, gia_fcra] = r;

      // Compute totals where they are 0 but sub-items exist
      const grantReceivedTotal = (gr_total || 0) || ((gr_govt || 0) + (gr_csr || 0) + (gr_fa || 0) + (gr_fcra || 0));
      const grantInAidTotal = (gia_total || 0) || ((gia_govt || 0) + (gia_csr || 0) + (gia_fa || 0) + (gia_fcra || 0));

      await client.query(`
        INSERT INTO finance_records (
          year, income, expenditure, surplus, turnover, total_assets, total_liabilities, networth,
          grant_received_total, grant_received_govt, grant_received_csr, grant_received_funding_agency, grant_received_fcra,
          grant_in_aid_total, grant_in_aid_govt, grant_in_aid_csr, grant_in_aid_funding_agency, grant_in_aid_fcra
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (year) DO UPDATE SET
          income = EXCLUDED.income, expenditure = EXCLUDED.expenditure, surplus = EXCLUDED.surplus,
          turnover = EXCLUDED.turnover, total_assets = EXCLUDED.total_assets, total_liabilities = EXCLUDED.total_liabilities,
          networth = EXCLUDED.networth, grant_received_total = EXCLUDED.grant_received_total,
          grant_received_govt = EXCLUDED.grant_received_govt, grant_received_csr = EXCLUDED.grant_received_csr,
          grant_received_funding_agency = EXCLUDED.grant_received_funding_agency, grant_received_fcra = EXCLUDED.grant_received_fcra,
          grant_in_aid_total = EXCLUDED.grant_in_aid_total, grant_in_aid_govt = EXCLUDED.grant_in_aid_govt,
          grant_in_aid_csr = EXCLUDED.grant_in_aid_csr, grant_in_aid_funding_agency = EXCLUDED.grant_in_aid_funding_agency,
          grant_in_aid_fcra = EXCLUDED.grant_in_aid_fcra, updated_at = NOW()
      `, [year, income, expenditure, surplus, turnover, total_assets, total_liabilities, networth,
          grantReceivedTotal, gr_govt || 0, gr_csr || 0, gr_fa || 0, gr_fcra || 0,
          grantInAidTotal, gia_govt || 0, gia_csr || 0, gia_fa || 0, gia_fcra || 0]);

      console.log(`  Inserted/updated: ${year}`);
    }

    await client.query("COMMIT");
    console.log("\n✅ Finance seeding complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err.message);
    console.error(err.stack);
  } finally {
    client.release();
    pool.end();
  }
}

createFinanceTable();
