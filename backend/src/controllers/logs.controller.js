
const GlobalLog = require('../models/GlobalLog');

// @desc    Log an event
// @access  Internal
const logEvent = async (eventData) => {
  try {
    const log = new GlobalLog({
      ...eventData,
      created_at: new Date()
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log event:', error);
    // Don't throw error to avoid disrupting main operations
    return null;
  }
};

// Middleware to log all requests
const logRequest = (req, res, next) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response data
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log the request (async, don't wait)
    setImmediate(() => {
      logEvent({
        event_type: 'api_call',
        event_action: req.method.toLowerCase(),
        event_description: `${req.method} ${req.originalUrl}`,
        user_id: req.user?.id,
        company_id: req.user?.company_id,
        user_role: req.user?.role,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        request_method: req.method,
        request_url: req.originalUrl,
        request_params: req.params,
        request_body: req.method === 'GET' ? undefined : req.body,
        response_status: res.statusCode,
        response_time_ms: responseTime,
        severity: res.statusCode >= 400 ? 'warning' : 'info',
        status: res.statusCode >= 400 ? 'failure' : 'success'
      });
    });

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// @desc    Get logs with filters
// @route   GET /api/logs
// @access  Private (Master Admin or Company Super Admin)
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      event_type,
      severity,
      user_id,
      start_date,
      end_date
    } = req.query;

    // Build filter query
    const filter = {};

    // Company scope for non-master admins
    if (req.user.role !== 'master_admin') {
      filter.company_id = req.user.company_id;
    }

    if (event_type) filter.event_type = event_type;
    if (severity) filter.severity = severity;
    if (user_id) filter.user_id = user_id;

    // Date range filter
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date);
      if (end_date) filter.created_at.$lte = new Date(end_date);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get logs with pagination
    const logs = await GlobalLog.find(filter)
      .populate('user_id', 'username email')
      .populate('company_id', 'company_name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await GlobalLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving logs'
    });
  }
};

// @desc    Get log analytics
// @route   GET /api/logs/analytics
// @access  Private (Master Admin or Company Super Admin)
const getLogAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = { created_at: { $gte: startDate } };
    
    // Company scope for non-master admins
    if (req.user.role !== 'master_admin') {
      filter.company_id = req.user.company_id;
    }

    // Get event type distribution
    const eventTypeStats = await GlobalLog.aggregate([
      { $match: filter },
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get severity distribution
    const severityStats = await GlobalLog.aggregate([
      { $match: filter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get daily activity
    const dailyActivity = await GlobalLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          total_events: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $eq: ["$severity", "error"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top users by activity
    const topUsers = await GlobalLog.aggregate([
      { $match: { ...filter, user_id: { $exists: true } } },
      { $group: { _id: '$user_id', activity_count: { $sum: 1 } } },
      { $sort: { activity_count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        event_types: eventTypeStats,
        severity_distribution: severityStats,
        daily_activity: dailyActivity,
        top_users: topUsers,
        period_days: parseInt(days)
      }
    });

  } catch (error) {
    console.error('Get log analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving log analytics'
    });
  }
};

module.exports = {
  logEvent,
  logRequest,
  getLogs,
  getLogAnalytics
};
