const ROSTER = [];
for (let i = 141; i <= 207; i++) ROSTER.push(`24CS${i}`);
['304', '310', '313', '318', '319', '320'].forEach((n) => ROSTER.push(`24CS${n}`));

const ROSTER_SET = new Set(ROSTER);

function isAllowedRegisterNo(regNo) {
  return ROSTER_SET.has(String(regNo).trim().toUpperCase());
}

module.exports = { ROSTER, ROSTER_SET, isAllowedRegisterNo };
