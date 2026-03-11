// loanUtils.js
export const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const generateRepaymentSchedule = (
    principal,
    annualRate,
    termMonths
) => {
    const schedule = [];
    const r = annualRate / 12 / 100;
    const n = termMonths;

    const monthlyPayment =
        r === 0
            ? principal / n
            : (principal * r * Math.pow(1 + r, n)) /
            (Math.pow(1 + r, n) - 1);

    let balance = principal;

    for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        const principalPayment = monthlyPayment - interest;
        balance -= principalPayment;

        schedule.push({
            month: i,
            payment: monthlyPayment,
            principal: principalPayment,
            interest,
            balance: balance > 0 ? balance : 0,
        });
    }

    return schedule;
};
