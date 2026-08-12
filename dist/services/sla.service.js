export const FIRST_RESPONSE_HOURS = 24;
export const RESOLUTION_WORKING_DAYS = 5;
export function addWorkingDays(start, days) {
    const result = new Date(start);
    let remaining = days;
    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0 && day !== 6)
            remaining -= 1;
    }
    return result;
}
export function getSlaDates(createdAt) {
    return {
        firstResponseDueAt: new Date(createdAt.getTime() + FIRST_RESPONSE_HOURS * 60 * 60 * 1000),
        resolutionDueAt: addWorkingDays(createdAt, RESOLUTION_WORKING_DAYS),
    };
}
export function isNearDeadline(dueAt, now = new Date()) {
    if (!dueAt)
        return false;
    const remaining = dueAt.getTime() - now.getTime();
    return remaining > 0 && remaining <= 24 * 60 * 60 * 1000;
}
