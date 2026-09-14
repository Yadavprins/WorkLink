const CATEGORY_SKILL_MAP = {
    plumbing: "Plumber",
    electrical: "Electrician",
    "ac & appliance": "AC Technician",
    carpentry: "Carpenter",
    painting: "Painter",
    cleaning: "Cleaner",
    "vehicle repair": "Mechanic",
    appliance: "Appliance Technician",
    "appliance repair": "Appliance Technician",
    "ac repair": "AC Technician",
};

const DEFAULT_CATEGORIES = [
    { name: "Plumbing", skill: "Plumber" },
    { name: "Electrical", skill: "Electrician" },
    { name: "AC & Appliance", skill: "AC Technician" },
    { name: "Carpentry", skill: "Carpenter" },
    { name: "Painting", skill: "Painter" },
    { name: "Cleaning", skill: "Cleaner" },
    { name: "Vehicle Repair", skill: "Mechanic" },
    { name: "Other", skill: "General Worker" },
];

const getRequiredSkill = (category, existingSkill) => {
    if (existingSkill && String(existingSkill).trim()) {
        return String(existingSkill).trim();
    }

    const value = String(category || "")
        .trim()
        .toLowerCase();

    return CATEGORY_SKILL_MAP[value] || category || "General Worker";
};

module.exports = {
    CATEGORY_SKILL_MAP,
    DEFAULT_CATEGORIES,
    getRequiredSkill,
};
