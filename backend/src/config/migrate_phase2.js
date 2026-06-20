require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runPhase2Migration() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database migration for Phase 2...");
    await client.query("BEGIN");

    // 1. Add columns to projects table
    await client.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS classification_method VARCHAR(50) DEFAULT 'Manual'
    `);
    console.log("✅ Columns 'is_archived' and 'classification_method' verified/added to table 'projects'");

    // 2. Populate SDGs if empty
    const sdgCount = await client.query("SELECT COUNT(*) FROM sdgs");
    if (Number(sdgCount.rows[0].count) === 0) {
      console.log("Populating SDGs...");
      const sdgData = [
        ['SDG 1', 'No Poverty', 'End poverty in all its forms everywhere'],
        ['SDG 2', 'Zero Hunger', 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture'],
        ['SDG 3', 'Good Health and Well-being', 'Ensure healthy lives and promote well-being for all at all ages'],
        ['SDG 4', 'Quality Education', 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all'],
        ['SDG 5', 'Gender Equality', 'Achieve gender equality and empower all women and girls'],
        ['SDG 6', 'Clean Water and Sanitation', 'Ensure availability and sustainable management of water and sanitation for all'],
        ['SDG 7', 'Affordable and Clean Energy', 'Ensure access to affordable, reliable, sustainable and modern energy for all'],
        ['SDG 8', 'Decent Work and Economic Growth', 'Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all'],
        ['SDG 9', 'Industry, Innovation and Infrastructure', 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation'],
        ['SDG 10', 'Reduced Inequalities', 'Reduce inequality within and among countries'],
        ['SDG 11', 'Sustainable Cities and Communities', 'Make cities and human settlements inclusive, safe, resilient and sustainable'],
        ['SDG 12', 'Responsible Consumption and Production', 'Ensure sustainable consumption and production patterns'],
        ['SDG 13', 'Climate Action', 'Take urgent action to combat climate change and its impacts'],
        ['SDG 14', 'Life Below Water', 'Conserve and sustainably use the oceans, seas and marine resources for sustainable development'],
        ['SDG 15', 'Life on Land', 'Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss'],
        ['SDG 16', 'Peace, Justice and Strong Institutions', 'Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels'],
        ['SDG 17', 'Partnerships for the Goals', 'Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development']
      ];

      for (const [code, name, desc] of sdgData) {
        await client.query(
          "INSERT INTO sdgs (sdg_code, sdg_name, sdg_description, is_active) VALUES ($1, $2, $3, true)",
          [code, name, desc]
        );
      }
      console.log("✅ 17 Sustainable Development Goals populated");
    } else {
      console.log("ℹ️ SDGs table already populated");
    }

    // 3. Populate districts and blocks if empty
    const districtCount = await client.query("SELECT COUNT(*) FROM districts");
    if (Number(districtCount.rows[0].count) === 0) {
      console.log("Populating sample districts and blocks...");
      
      // Let's get actual state IDs from database
      const statesRes = await client.query("SELECT state_id, state_name FROM states");
      
      const rajState = statesRes.rows.find(s => s.state_name === 'Rajasthan');
      const gujState = statesRes.rows.find(s => s.state_name === 'Gujarat');

      if (rajState) {
        const rId = rajState.state_id;
        const rajDistricts = ['Udaipur', 'Jaipur', 'Jodhpur', 'Ajmer', 'Kota'];
        const blockMappings = {
          'Udaipur': ['Girwa', 'Gogunda', 'Jhadol', 'Kherwara', 'Mavli'],
          'Jaipur': ['Amber', 'Govindgarh', 'Jhalana', 'Sanganer', 'Shahpura'],
          'Jodhpur': ['Luni', 'Mandore', 'Bilara', 'Shergarh', 'Balesar'],
          'Ajmer': ['Srinagar', 'Pisangan', 'Kishangarh', 'Beawar', 'Kekri'],
          'Kota': ['Ladpura', 'Sangod', 'Itawa', 'Sultanpur', 'Khairabad']
        };

        for (const dist of rajDistricts) {
          const distInsert = await client.query(
            "INSERT INTO districts (state_id, district_name, is_active) VALUES ($1, $2, true) RETURNING district_id",
            [rId, dist]
          );
          const distId = distInsert.rows[0].district_id;
          
          for (const block of blockMappings[dist]) {
            await client.query(
              "INSERT INTO blocks (district_id, block_name, is_active) VALUES ($1, $2, true)",
              [distId, block]
            );
          }
        }
        console.log("✅ Rajasthan sample districts & blocks populated");
      }

      if (gujState) {
        const gId = gujState.state_id;
        const gujDistricts = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];
        const blockMappings = {
          'Ahmedabad': ['City', 'Daskroi', 'Detroj', 'Sanand', 'Viramgam'],
          'Surat': ['Bardoli', 'Chorasi', 'Kamrej', 'Olpad', 'Palsana'],
          'Vadodara': ['City', 'Dabhoi', 'Karjan', 'Padra', 'Savli'],
          'Rajkot': ['City', 'Gondal', 'Jetpur', 'Morbi', 'Upleta'],
          'Gandhinagar': ['City', 'Dehgam', 'Kalol', 'Mansa']
        };

        for (const dist of gujDistricts) {
          const distInsert = await client.query(
            "INSERT INTO districts (state_id, district_name, is_active) VALUES ($1, $2, true) RETURNING district_id",
            [gId, dist]
          );
          const distId = distInsert.rows[0].district_id;
          
          for (const block of blockMappings[dist]) {
            await client.query(
              "INSERT INTO blocks (district_id, block_name, is_active) VALUES ($1, $2, true)",
              [distId, block]
            );
          }
        }
        console.log("✅ Gujarat sample districts & blocks populated");
      }
    } else {
      console.log("ℹ️ Districts table already populated");
    }

    await client.query("COMMIT");
    console.log("🎉 Phase 2 Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runPhase2Migration();
