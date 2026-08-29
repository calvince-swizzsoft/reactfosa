const EMAIL_PATTERN = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
const MOBILE_PATTERN = /^\+[0-9]{7,15}$/;

export function validateBranch(form) {
    const errors = [];

    if (!String(form.companyId ?? "").trim()) {
        errors.push("Company is required.");
    }
    const description = String(form.description ?? "").trim();
    if (!description) {
        errors.push("Description is required.");
    } else if (!/[A-Za-z]/.test(description)) {
        errors.push("Description must be a branch name, not a numeric branch code.");
    }

    const email = String(form.addressEmail ?? "").trim();
    const mobile = String(form.addressMobileLine ?? "").trim();

    if (email && !EMAIL_PATTERN.test(email)) {
        errors.push("Invalid email address.");
    }
    if (mobile && !MOBILE_PATTERN.test(mobile)) {
        errors.push("The mobile number should start with a plus sign, followed by the country code and national number.");
    }

    return errors;
}

export function showBranchValidationErrors(errors) {
    return {
        title: "Check Branch Details",
        html: `<div style="text-align:left">${errors.map((message) => `<div>• ${message}</div>`).join("")}</div>`,
        icon: "warning",
    };
}
