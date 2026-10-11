export const REPORT_STATUSES = ["open", "assigned", "cleared"] as const;

export const REPORT_DESCRIPTION = { min: 5, max: 1000 } as const;

export const REPORTS_MAX_SPAN = 0.5;

export const REPORTS_LIMIT = 500;

export const REPORTS_PAGE_SIZE = 25;

export const REPORTS_PAGE_SIZES = [10, 25, 50] as const;

export const REPORTS_MAX_PAGE = 99_999;

export const REPORT_SEARCH_MAX = 100;

export const REPORT_SORTS = ["reported", "cleared", "status"] as const;
