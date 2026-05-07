const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedJobs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    // Create a dummy employer first
    const [userResult] = await connection.query(
        'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin Employer', 'admin@jobportal.com', 'hashedpassword', 'employer']
    );
    
    // Get employer ID
    const [rows] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@jobportal.com']);
    const employerId = rows[0].id;

    const jobs = [
        ['Senior Web Developer', 'TechNova Solutions', 'Remote', '$120k - $150k', 'Looking for an expert in React and Node.js.', 'React, Node.js, JavaScript, MySQL'],
        ['UI/UX Designer', 'Creative Pixel', 'New York, NY', '$90k - $110k', 'Design beautiful interfaces for our mobile apps.', 'Figma, Adobe XD, CSS, HTML'],
        ['Full Stack Engineer', 'Global Systems', 'Bangalore, India', '₹15L - ₹25L', 'Join our core platform team.', 'Java, Spring Boot, React, AWS'],
        ['Data Analyst', 'Insight Corp', 'London, UK', '£50k - £70k', 'Analyze large datasets to drive business decisions.', 'Python, SQL, Tableau, Statistics']
    ];

    for (const [title, company, location, salary, description, requirements] of jobs) {
        await connection.query(
            'INSERT INTO jobs (employer_id, title, company, location, salary, description, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employerId, title, company, location, salary, description, requirements]
        );
    }

    console.log('Seed data added successfully.');
    await connection.end();
}

seedJobs().catch(console.error);
