const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Multer Setup for Resumes
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Get Profile & Skills
router.get('/profile', auth, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
        const [skills] = await db.execute('SELECT skill_name FROM skills WHERE user_id = ?', [req.user.id]);
        const [resumes] = await db.execute('SELECT file_path FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [req.user.id]);

        res.json({
            user: users[0],
            skills: skills.map(s => s.skill_name),
            resume: resumes[0]?.file_path || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Skills
router.post('/skills', auth, async (req, res) => {
    const { skills } = req.body; // Array of strings
    try {
        await db.execute('DELETE FROM skills WHERE user_id = ?', [req.user.id]);
        for (const skill of skills) {
            await db.execute('INSERT INTO skills (user_id, skill_name) VALUES (?, ?)', [req.user.id, skill]);
        }
        res.json({ message: 'Skills updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Resume
router.post('/resume', auth, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const filePath = `/uploads/${req.file.filename}`;
        await db.execute('INSERT INTO resumes (user_id, file_path) VALUES (?, ?)', [req.user.id, filePath]);
        
        res.json({ message: 'Resume uploaded successfully', filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Dashboard (Applications or Postings)
router.get('/dashboard', auth, async (req, res) => {
    try {
        if (req.user.role === 'applicant') {
            const [apps] = await db.execute(
                `SELECT a.id, a.status, a.applied_at, j.title, j.company, j.location 
                 FROM applications a 
                 JOIN jobs j ON a.job_id = j.id 
                 WHERE a.applicant_id = ?`,
                [req.user.id]
            );
            res.json(apps);
        } else {
            const [jobs] = await db.execute(
                `SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as app_count 
                 FROM jobs j WHERE j.employer_id = ?`,
                [req.user.id]
            );
            res.json(jobs);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Applicants for a Job (Employer only)
router.get('/job/:id/applicants', auth, async (req, res) => {
    if (req.user.role !== 'employer') return res.status(403).json({ message: 'Unauthorized' });

    try {
        const [applicants] = await db.execute(
            `SELECT u.name, u.email, a.id as app_id, a.status, 
             (SELECT file_path FROM resumes WHERE user_id = u.id ORDER BY uploaded_at DESC LIMIT 1) as resume
             FROM applications a
             JOIN users u ON a.applicant_id = u.id
             WHERE a.job_id = ?`,
            [req.params.id]
        );
        res.json(applicants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
