const VALIDATORS = [
    { name: "Olojede Jahnifemi", email: "dolaponifemi941@gmail.com" },
    { name: "Adams Afeez", email: "adamsafeez4@gmail.com" },
    { name: "Oladipo Evangel", email: "oladipoevangel90@gmail.com" },
    { name: "Akinwamide Bukummi", email: "bukunmiabiodun14@gmail.com" },
    { name: "Sunday Justice", email: "onyekaozuru122@gmail.com" },
];

const PEOPLE = VALIDATORS.map((validator) => validator.name);

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function daysFromToday(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return Math.round(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
}

function getDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const startDate = new Date(2026, 1, 1);
const endDate = new Date(2026, 3, 30);

function generateSchedule() {
    const days = [];
    let personIndex = 0;

    for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
    ) {
        const day = new Date(d);
        const weekday = day.getDay();

        const isFreeDay = weekday === 3 || weekday === 6; // Wed, Sat

        days.push({
            date: day,
            name: isFreeDay ? "Free" : PEOPLE[personIndex % PEOPLE.length],
            free: isFreeDay,
        });

        if (!isFreeDay) personIndex++;
    }

    return days;
}

const schedule = generateSchedule();

function groupByWeek(entries: typeof schedule) {
    const weekMap = new Map<string, typeof schedule>();

    entries.forEach((entry) => {
        const weekKey = entry.date.toLocaleDateString(undefined, {
            year: "numeric",
            week: "numeric",
        } as Intl.DateTimeFormatOptions);

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
        }
        weekMap.get(weekKey)!.push(entry);
    });

    return Array.from(weekMap.values());
}

const weeks = groupByWeek(schedule);

export { isSameDay, daysFromToday, getDateKey, schedule, weeks, groupByWeek, PEOPLE, VALIDATORS };
