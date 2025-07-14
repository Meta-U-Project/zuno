function convertPreferredTimesToMap(preferredTimes) {
    const preferenceMap = {};

    preferredTimes.forEach(pref => {
        const day = pref.day.toLowerCase();

        if (!preferenceMap[day]) {
            preferenceMap[day] = [];
        }

        preferenceMap[day].push({
            start: pref.startTime,
            end: pref.endTime
        });
    });

    Object.keys(preferenceMap).forEach(day => {
        preferenceMap[day].sort((a, b) => a.start.localeCompare(b.start));
    });

    return preferenceMap;
}

function getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getTimeString(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function timeRangesOverlap(range1, range2) {
    const start1 = timeToMinutes(range1.start);
    const end1 = timeToMinutes(range1.end);
    const start2 = timeToMinutes(range2.start);
    const end2 = timeToMinutes(range2.end);

    return start1 < end2 && start2 < end1;
}

function getTimeRangeOverlap(range1, range2) {
    if (!timeRangesOverlap(range1, range2)) {
        return null;
    }

    const start1 = timeToMinutes(range1.start);
    const end1 = timeToMinutes(range1.end);
    const start2 = timeToMinutes(range2.start);
    const end2 = timeToMinutes(range2.end);

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    return {
        start: minutesToTime(overlapStart),
        end: minutesToTime(overlapEnd)
    };
}

function filterSlotsByPreferences(freeSlots, preferenceMap) {
    const filteredSlots = [];

    freeSlots.forEach(slot => {
        const dayName = getDayName(slot.start);
        const preferredTimesForDay = preferenceMap[dayName];

        if (!preferredTimesForDay || preferredTimesForDay.length === 0) {
            return;
        }

        const slotTimeRange = {
            start: getTimeString(slot.start),
            end: getTimeString(slot.end)
        };

        preferredTimesForDay.forEach(preferredRange => {
            const overlap = getTimeRangeOverlap(slotTimeRange, preferredRange);

            if (overlap) {
                const overlapStart = new Date(slot.start);
                const overlapEnd = new Date(slot.start);

                const [startHours, startMinutes] = overlap.start.split(':').map(Number);
                const [endHours, endMinutes] = overlap.end.split(':').map(Number);

                overlapStart.setHours(startHours, startMinutes, 0, 0);
                overlapEnd.setHours(endHours, endMinutes, 0, 0);

                const durationMinutes = (overlapEnd - overlapStart) / (1000 * 60);
                if (durationMinutes >= 30) {
                    filteredSlots.push({
                        start: overlapStart,
                        end: overlapEnd,
                        originalSlot: slot,
                        preferredRange: preferredRange,
                        day: dayName,
                        duration: durationMinutes
                    });
                }
            }
        });
    });

    filteredSlots.sort((a, b) => a.start - b.start);

    return filteredSlots;
}

async function getUserPreferenceMap(userId, prisma) {
    try {
        const preferredTimes = await prisma.preferredStudyTime.findMany({
            where: { userId },
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' }
            ]
        });

        return convertPreferredTimesToMap(preferredTimes);
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return {};
    }
}

function isValidTimeFormat(timeStr) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
}

function isValidDay(day) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return validDays.includes(day.toLowerCase());
}

function validatePreferredTime(preferredTime) {
    const errors = [];

    if (!preferredTime.day || !isValidDay(preferredTime.day)) {
        errors.push('Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday');
    }

    if (!preferredTime.startTime || !isValidTimeFormat(preferredTime.startTime)) {
        errors.push('Invalid startTime format. Must be HH:mm (e.g., 09:30)');
    }

    if (!preferredTime.endTime || !isValidTimeFormat(preferredTime.endTime)) {
        errors.push('Invalid endTime format. Must be HH:mm (e.g., 17:30)');
    }

    if (preferredTime.startTime && preferredTime.endTime &&
        isValidTimeFormat(preferredTime.startTime) && isValidTimeFormat(preferredTime.endTime)) {
        const startMinutes = timeToMinutes(preferredTime.startTime);
        const endMinutes = timeToMinutes(preferredTime.endTime);

        if (startMinutes >= endMinutes) {
            errors.push('startTime must be before endTime');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    convertPreferredTimesToMap,
    getDayName,
    timeToMinutes,
    minutesToTime,
    getTimeString,
    timeRangesOverlap,
    getTimeRangeOverlap,
    filterSlotsByPreferences,
    getUserPreferenceMap,
    isValidTimeFormat,
    isValidDay,
    validatePreferredTime
};
