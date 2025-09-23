const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const getUsageStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get upload statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_uploads,
        COUNT(CASE WHEN upload_status = 'success' THEN 1 END) as successful_uploads,
        COUNT(CASE WHEN upload_status = 'failed' THEN 1 END) as failed_uploads,
        COALESCE(SUM(file_size), 0) as total_size,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM upload_history 
      WHERE user_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [decoded.id]);
    const stats = statsResult.rows[0];

    // Get uploads by date for chart
    const dailyQuery = `
      SELECT 
        DATE(created_at) as upload_date,
        COUNT(*) as count,
        SUM(file_size) as size
      FROM upload_history 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY upload_date DESC
    `;

    const dailyResult = await pool.query(dailyQuery, [decoded.id]);

    res.json({
      summary: {
        totalUploads: parseInt(stats.total_uploads),
        successfulUploads: parseInt(stats.successful_uploads),
        failedUploads: parseInt(stats.failed_uploads),
        totalSize: parseInt(stats.total_size),
        activeDays: parseInt(stats.active_days)
      },
      daily: dailyResult.rows
    });

  } catch (error) {
    console.error('Error getting usage stats:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
};

const getQuotaInfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user's package info (for now, return default values)
    // In a real implementation, this would fetch from a subscriptions table
    const quota = {
      package: 'Basic',
      totalQuota: 10000, // 10,000 images
      usedQuota: 0,
      remainingQuota: 10000,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    };

    // Get actual usage count
    const countQuery = `
      SELECT COUNT(*) as used_count 
      FROM upload_history 
      WHERE user_id = $1 AND upload_status = 'success'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const countResult = await pool.query(countQuery, [decoded.id]);
    quota.usedQuota = parseInt(countResult.rows[0].used_count);
    quota.remainingQuota = quota.totalQuota - quota.usedQuota;

    res.json({ quota });

  } catch (error) {
    console.error('Error getting quota info:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get quota information' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { days = 7 } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get recent activity summary
    const activityQuery = `
      SELECT 
        DATE(created_at) as activity_date,
        COUNT(*) as uploads,
        COUNT(CASE WHEN upload_status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN upload_status = 'failed' THEN 1 END) as failed
      FROM upload_history 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '%s days'
      GROUP BY DATE(created_at)
      ORDER BY activity_date DESC
    `;

    const activityResult = await pool.query(activityQuery.replace('%s', days), [decoded.id]);

    // Get hourly distribution for today
    const hourlyQuery = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM upload_history 
      WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    const hourlyResult = await pool.query(hourlyQuery, [decoded.id]);

    res.json({
      daily: activityResult.rows,
      hourly: hourlyResult.rows,
      period: parseInt(days)
    });

  } catch (error) {
    console.error('Error getting recent activity:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
};

module.exports = {
  getUsageStats,
  getQuotaInfo,
  getRecentActivity
};