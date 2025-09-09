const GlobalLog = require("../models/GlobalLog");
const User = require("../models/User");
const Company = require("../models/Company");

// @desc    Log an event (Optimized for high volume)
// @access  Internal
const logEvent = async (eventData) => {
  try {
    // Use insertOne for better performance than save()
    await GlobalLog.collection.insertOne({
      ...eventData,
      created_at: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Failed to log event:", error);
    return false;
  }
};

// Optimized middleware to log all requests
const logRequest = (req, res, next) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;

    // Only log if response time > 100ms or status >= 400 to reduce volume
    const shouldLog = responseTime > 100 || res.statusCode >= 400;

    if (shouldLog) {
      // Use setImmediate for non-blocking operation
      setImmediate(() => {
        const severity =
          res.statusCode >= 500
            ? "error"
            : res.statusCode >= 400
            ? "warning"
            : "info";
        const status = res.statusCode >= 400 ? "failure" : "success";

        logEvent({
          event_type: "api_call",
          event_action: req.method.toLowerCase(),
          event_description: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
          user_id: req.user?.id,
          company_id: req.user?.company_id,
          user_role: req.user?.role,
          ip_address: req.ip || req.connection.remoteAddress,
          request_method: req.method,
          request_url:
            req.originalUrl.length > 500
              ? req.originalUrl.substring(0, 500)
              : req.originalUrl,
          response_status: res.statusCode,
          response_time_ms: responseTime,
          severity,
          status,
        });
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// @desc    Get logs with filters (Highly optimized for 50+ lakh records)
// @route   GET /api/logs
// @access  Private (Master Admin or Company Super Admin)
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      event_type,
      event_action,
      severity,
      status,
      user_id,
      company_id,
      user_role,
      request_method,
      response_status,
      resource_type,
      ip_address,
      search,
      start_date,
      end_date,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    // Validate and sanitize inputs
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Reduced max limit
    const skip = (pageNum - 1) * limitNum;

    // Build optimized filter query using the schema's static method
    const baseFilters = {
      event_type,
      severity,
      status,
      user_id,
      company_id:
        company_id ||
        (req.user.role !== "master_admin" ? req.user.company_id : undefined),
      user_role,
      request_method,
      start_date,
      end_date,
    };

    const { query: filter, sort } = GlobalLog.createOptimizedQuery(baseFilters);

    // Add additional filters
    if (event_action && event_action !== "all")
      filter.event_action = event_action;
    if (resource_type && resource_type !== "all")
      filter.resource_type = resource_type;
    if (ip_address) {
      filter.ip_address = new RegExp(
        ip_address.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
    }

    // Response status filter
    if (response_status) {
      const statusCode = parseInt(response_status);
      if (!isNaN(statusCode)) {
        filter.response_status = statusCode;
      }
    }

    // Text search using MongoDB text index
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Validate sort parameters
    const validSortFields = [
      "created_at",
      "event_type",
      "severity",
      "response_time_ms",
      "response_status",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    const sortDirection = sort_order === "asc" ? 1 : -1;
    sort[sortField] = sortDirection;

    // Use aggregation pipeline with optimizations for large datasets
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          // Data pipeline with efficient lookups
          data: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limitNum },
            // Optimized lookup for users - only fetch required fields
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_info",
                pipeline: [{ $project: { username: 1, email: 1 } }],
              },
            },
            // Optimized lookup for companies - only fetch required fields
            {
              $lookup: {
                from: "companies",
                localField: "company_id",
                foreignField: "_id",
                as: "company_info",
                pipeline: [{ $project: { company_name: 1 } }],
              },
            },
            // Project only necessary fields to reduce data transfer
            {
              $project: {
                _id: 1,
                event_type: 1,
                event_action: 1,
                event_description: { $substr: ["$event_description", 0, 200] }, // Truncate for list view
                user_id: { $arrayElemAt: ["$user_info", 0] },
                company_id: { $arrayElemAt: ["$company_info", 0] },
                user_role: 1,
                ip_address: 1,
                request_method: 1,
                request_url: { $substr: ["$request_url", 0, 100] }, // Truncate for list view
                response_status: 1,
                response_time_ms: 1,
                severity: 1,
                status: 1,
                created_at: 1,
                error_message: { $substr: ["$error_message", 0, 100] }, // Truncate for list view
                resource_type: 1,
                resource_id: 1,
              },
            },
          ],
          // Count pipeline - optimized
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    // Add hint to use the best index
    const aggregateOptions = {
      allowDiskUse: true, // Allow disk usage for large datasets
      maxTimeMS: 30000, // 30 second timeout
    };

    // Suggest index based on filter
    if (filter.company_id && filter.created_at) {
      aggregateOptions.hint = { company_id: 1, created_at: -1 };
    } else if (filter.created_at) {
      aggregateOptions.hint = { created_at: -1 };
    }

    const [result] = await GlobalLog.aggregate(pipeline, aggregateOptions);
    const logs = result.data || [];
    const total = result.totalCount[0]?.count || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_records: total,
        per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1,
      },
      filters_applied: {
        event_type: event_type || null,
        severity: severity || null,
        user_id: user_id || null,
        company_id: company_id || null,
        date_range: {
          start: start_date || null,
          end: end_date || null,
        },
        search: search || null,
      },
      performance: {
        page_size: limitNum,
        total_filtered: total,
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving logs",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get log analytics (Highly optimized for large datasets)
// @route   GET /api/logs/analytics
// @access  Private (Master Admin or Company Super Admin)
const getLogAnalytics = async (req, res) => {
  try {
    const {
      days = 7,
      start_date,
      end_date,
      company_id,
      event_type,
    } = req.query;

    // Build date filter
    let dateFilter;
    if (start_date && end_date) {
      dateFilter = {
        $gte: new Date(start_date),
        $lte: new Date(end_date + "T23:59:59.999Z"),
      };
    } else {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      dateFilter = { $gte: startDate };
    }

    const baseFilter = { created_at: dateFilter };

    // Company scope for non-master admins
    if (req.user.role !== "master_admin" && req.user.company_id) {
      baseFilter.company_id = req.user.company_id;
    } else if (company_id && company_id !== "all") {
      baseFilter.company_id = company_id;
    }

    if (event_type && event_type !== "all") {
      baseFilter.event_type = event_type;
    }

    // Optimized aggregation with index hints
    const aggregateOptions = {
      allowDiskUse: true,
      maxTimeMS: 45000, // 45 second timeout for analytics
    };

    // Use parallel aggregations with proper index hints
    const [
      eventTypeStats,
      severityStats,
      dailyActivity,
      topUsers,
      responseTimeStats,
      errorRateStats,
    ] = await Promise.all([
      // Event type distribution
      GlobalLog.aggregate(
        [
          { $match: baseFilter },
          {
            $group: {
              _id: "$event_type",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        aggregateOptions
      ),

      // Severity distribution
      GlobalLog.aggregate(
        [
          { $match: baseFilter },
          {
            $group: {
              _id: "$severity",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ],
        aggregateOptions
      ),

      // Daily activity with sampling for large datasets
      GlobalLog.aggregate(
        [
          { $match: baseFilter },
          { $sample: { size: Math.min(100000, 500000) } }, // Sample for performance
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
              },
              total_events: { $sum: 1 },
              errors: {
                $sum: {
                  $cond: [{ $in: ["$severity", ["error", "critical"]] }, 1, 0],
                },
              },
              warnings: {
                $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] },
              },
              avg_response_time: {
                $avg: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$response_time_ms", 0] },
                        { $lt: ["$response_time_ms", 60000] }, // Filter outliers
                      ],
                    },
                    "$response_time_ms",
                    null,
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
        aggregateOptions
      ),

      // Top users by activity (limited and optimized)
      GlobalLog.aggregate(
        [
          {
            $match: {
              ...baseFilter,
              user_id: { $exists: true, $ne: null },
            },
          },
          { $sample: { size: 50000 } }, // Sample for performance
          {
            $group: {
              _id: "$user_id",
              activity_count: { $sum: 1 },
            },
          },
          { $sort: { activity_count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
              pipeline: [{ $project: { username: 1, email: 1, role: 1 } }],
            },
          },
          { $unwind: "$user" },
        ],
        aggregateOptions
      ),

      // Response time statistics (with sampling)
      GlobalLog.aggregate(
        [
          {
            $match: {
              ...baseFilter,
              response_time_ms: { $exists: true, $gt: 0, $lt: 60000 }, // Filter valid response times
            },
          },
          { $sample: { size: 10000 } }, // Sample for percentile calculation
          {
            $group: {
              _id: null,
              avg_response_time: { $avg: "$response_time_ms" },
              min_response_time: { $min: "$response_time_ms" },
              max_response_time: { $max: "$response_time_ms" },
              response_times: { $push: "$response_time_ms" }, // For P95 calculation
            },
          },
          {
            $project: {
              avg_response_time: 1,
              min_response_time: 1,
              max_response_time: 1,
              p95_response_time: {
                $arrayElemAt: [
                  {
                    $slice: [
                      { $sortArray: { input: "$response_times", sortBy: 1 } },
                      {
                        $floor: {
                          $multiply: [{ $size: "$response_times" }, 0.95],
                        },
                      },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ],
        aggregateOptions
      ),

      // Error rate by endpoint (optimized)
      GlobalLog.aggregate(
        [
          {
            $match: {
              ...baseFilter,
              event_type: "api_call",
              response_status: { $exists: true },
            },
          },
          { $sample: { size: 50000 } }, // Sample for performance
          {
            $group: {
              _id: { $substr: ["$request_url", 0, 50] }, // Truncate URL for grouping
              total_requests: { $sum: 1 },
              error_requests: {
                $sum: { $cond: [{ $gte: ["$response_status", 400] }, 1, 0] },
              },
            },
          },
          {
            $addFields: {
              error_rate: {
                $multiply: [
                  { $divide: ["$error_requests", "$total_requests"] },
                  100,
                ],
              },
            },
          },
          { $match: { total_requests: { $gte: 5 } } }, // Lower threshold for sampled data
          { $sort: { error_rate: -1 } },
          { $limit: 10 },
        ],
        aggregateOptions
      ),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          total_events: dailyActivity.reduce(
            (sum, day) => sum + day.total_events,
            0
          ),
          total_errors: dailyActivity.reduce((sum, day) => sum + day.errors, 0),
          total_warnings: dailyActivity.reduce(
            (sum, day) => sum + day.warnings,
            0
          ),
          avg_response_time: responseTimeStats[0]?.avg_response_time || 0,
          p95_response_time: responseTimeStats[0]?.p95_response_time || 0,
        },
        event_types: eventTypeStats,
        severity_distribution: severityStats,
        daily_activity: dailyActivity,
        top_users: topUsers,
        response_time_stats: responseTimeStats[0] || {},
        error_rate_by_endpoint: errorRateStats,
        period_days: parseInt(days),
        date_range: {
          start: start_date || null,
          end: end_date || null,
        },
        note: "Analytics based on statistical sampling for performance optimization",
      },
    });
  } catch (error) {
    console.error("Get log analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving log analytics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get users for log filters (Cached and optimized)
// @route   GET /api/logs/users
// @access  Private
// @desc    Get users for log filters (Optimized)
// @route   GET /api/logs/users
// @access  Private
const getLogUsers = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    const filter = { is_active: true }; // Use is_active instead of status

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { first_name: searchRegex },
        { last_name: searchRegex },
      ];
    }

    // For non-master admins, only show users from their company
    if (req.user.role !== "master_admin" && req.user.company_id) {
      filter.company_id = req.user.company_id;
    }

    const users = await User.find(filter)
      .select("_id username email first_name last_name role company_id")
      .populate("company_id", "company_name")
      .sort({ username: 1 })
      .limit(parseInt(limit))
      .lean(); // Removed .cache() for now

    // Format the response data
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      role: user.role,
      company_id: user.company_id?._id,
      company_name: user.company_id?.company_name,
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Get log users error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get companies for log filters (Cached and optimized)
// @route   GET /api/logs/companies
// @access  Private (Master Admin)
// @desc    Get companies for log filters (Optimized)
// @route   GET /api/logs/companies
// @access  Private (Master Admin)
const getLogCompanies = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    // Only master admins can see all companies
    if (req.user.role !== "master_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const filter = { is_active: true }; // Use is_active instead of status

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.company_name = searchRegex;
    }

    const companies = await Company.find(filter)
      .select(
        "_id company_name email phone city state country is_active created_at"
      )
      .sort({ company_name: 1 })
      .limit(parseInt(limit))
      .lean(); // Removed .cache() for now

    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Get log companies error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving companies",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Export logs as CSV (Optimized with streaming for large datasets)
// @route   GET /api/logs/export
// @access  Private (Master Admin)
const exportLogs = async (req, res) => {
  try {
    const {
      event_type,
      severity,
      user_id,
      company_id,
      start_date,
      end_date,
      limit = 10000, // Reduced limit for exports
    } = req.query;

    // Build filter query
    const filter = {};

    if (req.user.role !== "master_admin" && req.user.company_id) {
      filter.company_id = req.user.company_id;
    }

    if (event_type && event_type !== "all") filter.event_type = event_type;
    if (severity && severity !== "all") filter.severity = severity;
    if (user_id && user_id !== "all") filter.user_id = user_id;
    if (company_id && company_id !== "all") filter.company_id = company_id;

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date);
      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        filter.created_at.$lte = endDate;
      }
    }

    // Use streaming aggregation for large exports
    const pipeline = [
      { $match: filter },
      { $sort: { created_at: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
          pipeline: [{ $project: { username: 1, email: 1 } }],
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "company_id",
          foreignField: "_id",
          as: "company_info",
          pipeline: [{ $project: { company_name: 1 } }],
        },
      },
      {
        $project: {
          created_at: 1,
          event_type: 1,
          event_action: 1,
          event_description: { $substr: ["$event_description", 0, 500] },
          username: { $arrayElemAt: ["$user_info.username", 0] },
          email: { $arrayElemAt: ["$user_info.email", 0] },
          company_name: { $arrayElemAt: ["$company_info.company_name", 0] },
          user_role: 1,
          ip_address: 1,
          request_method: 1,
          request_url: { $substr: ["$request_url", 0, 200] },
          response_status: 1,
          response_time_ms: 1,
          severity: 1,
          status: 1,
          resource_type: 1,
          resource_id: 1,
          error_message: { $substr: ["$error_message", 0, 200] },
        },
      },
    ];

    // Set headers for CSV download
    const timestamp = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=logs-export-${timestamp}.csv`
    );

    // Write CSV headers
    const csvHeaders = [
      "timestamp",
      "event_type",
      "event_action",
      "event_description",
      "username",
      "email",
      "company",
      "user_role",
      "ip_address",
      "request_method",
      "request_url",
      "response_status",
      "response_time_ms",
      "severity",
      "status",
      "resource_type",
      "resource_id",
      "error_message",
    ];
    res.write(csvHeaders.join(",") + "\n");

    // Stream data using cursor for memory efficiency
    const cursor = GlobalLog.aggregate(pipeline, {
      allowDiskUse: true,
      cursor: { batchSize: 1000 },
    });

    let count = 0;
    for await (const log of cursor) {
      const csvRow = [
        log.created_at ? new Date(log.created_at).toISOString() : "",
        log.event_type || "",
        log.event_action || "",
        `"${(log.event_description || "").replace(/"/g, '""')}"`,
        log.username || "System",
        log.email || "",
        log.company_name || "N/A",
        log.user_role || "",
        log.ip_address || "",
        log.request_method || "",
        `"${(log.request_url || "").replace(/"/g, '""')}"`,
        log.response_status || "",
        log.response_time_ms || "",
        log.severity || "",
        log.status || "",
        log.resource_type || "",
        log.resource_id || "",
        `"${(log.error_message || "").replace(/"/g, '""')}"`,
      ];

      res.write(csvRow.join(",") + "\n");
      count++;

      // Flush every 1000 records
      if (count % 1000 === 0) {
        await new Promise((resolve) =>
          res.flush ? res.flush(resolve) : resolve()
        );
      }
    }

    res.end();
  } catch (error) {
    console.error("Export logs error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error exporting logs",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
};

// @desc    Get log details by ID (Optimized)
// @route   GET /api/logs/:id
// @access  Private
const getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await GlobalLog.findById(id)
      .populate("user_id", "username email role")
      .populate("company_id", "company_name")
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log entry not found",
      });
    }

    // Check access permissions
    if (
      req.user.role !== "master_admin" &&
      log.company_id?._id?.toString() !== req.user.company_id?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Get log by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving log details",
    });
  }
};

module.exports = {
  logEvent,
  logRequest,
  getLogs,
  getLogAnalytics,
  getLogUsers,
  getLogCompanies,
  exportLogs,
  getLogById,
};
