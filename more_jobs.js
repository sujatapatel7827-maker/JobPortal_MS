const mysql = require('mysql2/promise');
require('dotenv').config();

async function moreJobs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    const [rows] = await connection.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['employer']);
    const employerId = rows[0].id;

    const jobs = [
        ['Frontend Developer', 'Delhi Tech Hub', 'Delhi, India', '₹10L - ₹18L', 'React and Tailwind expert needed.', 'React, CSS, Tailwind, JavaScript'],
        ['Backend Engineer', 'Mumbai Systems', 'Mumbai, India', '₹12L - ₹22L', 'Node.js and MySQL focused role.', 'Node.js, MySQL, Redis, AWS'],
        ['Junior Frontend Dev', 'StartUp Delhi', 'Delhi', '₹6L - ₹10L', 'Great opportunity for freshers.', 'HTML, CSS, JavaScript'],
        ['Java Developer', 'Enterprise Corp', 'Noida', '₹8L - ₹15L', 'Spring Boot developer for banking systems.', 'Java, Spring Boot, SQL'],
        ['Full Stack Developer', 'Pune Innovations', 'Pune', '₹12L - ₹20L', 'Work on exciting new projects.', 'React, Node.js, MongoDB']
    ];

    for (const [title, company, location, salary, description, requirements] of jobs) {
        await connection.query(
            'INSERT INTO jobs (employer_id, title, company, location, salary, description, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employerId, title, company, location, salary, description, requirements]
        );
    }

    console.log('Extra dummy jobs added.');
    await connection.end();
}

moreJobs().catch(console.error);
