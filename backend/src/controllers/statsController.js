const pool = require('../../../shared/config/database');
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

    // Resolve current package from user_packages/packages (fallback to 'newbie')
    let pkg = null;
    try {
      const pkgQuery = `
        SELECT p.id, p.name, p.upload_limit, p.price
        FROM user_packages up
        JOIN packages p ON p.id = up.package_id
        WHERE up.user_id = $1
          AND (up.end_date IS NULL OR up.end_date >= CURRENT_DATE)
        ORDER BY up.start_date DESC
        LIMIT 1`;
      const pkgRes = await pool.query(pkgQuery, [decoded.id]);
      if (pkgRes.rows.length > 0) pkg = pkgRes.rows[0];
      if (!pkg) {
        const newbieRes = await pool.query(
          "SELECT id, name, upload_limit, price FROM packages WHERE name = 'newbie' AND is_active = true LIMIT 1"
        );
        if (newbieRes.rows.length > 0) {
          pkg = newbieRes.rows[0];
          // Auto-assign newbie if user has no package
          await pool.query(
            `INSERT INTO user_packages (user_id, package_id, start_date, is_trial)
             SELECT $1, $2, CURRENT_DATE, true
             WHERE NOT EXISTS (SELECT 1 FROM user_packages WHERE user_id = $1)`,
            [decoded.id, pkg.id]
          );
        }
      }
    } catch (e) {
      console.warn('Package lookup skipped:', e.message);
    }

    const totalQuota = pkg?.upload_limit || 10000;

    // Count total successful uploads (all-time)
    const countQuery = `
      SELECT COUNT(*) as used_count 
      FROM upload_history 
      WHERE user_id = $1 AND upload_status = 'success'`;
    const countResult = await pool.query(countQuery, [decoded.id]);
    const used = parseInt(countResult.rows[0].used_count || '0');

    res.json({
      quota: {
        package: pkg?.name || 'newbie',
        totalQuota,
        usedQuota: used,
        remainingQuota: Math.max(0, totalQuota - used),
        price: pkg?.price ?? null,
        resetDate: null,
      }
    });

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
