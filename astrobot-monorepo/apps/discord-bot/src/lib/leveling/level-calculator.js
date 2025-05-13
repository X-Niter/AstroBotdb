/**
 * Calculate the XP required to reach a specific level
 * Using a common formula: level^2 * multiplier + base
 * 
 * @param {number} level - The level to calculate XP for
 * @param {number} [multiplier=25] - XP curve multiplier
 * @param {number} [base=100] - Base XP for first level
 * @returns {number} - The total XP required to reach this level
 */
function calculateRequiredXP(level, multiplier = 25, base = 100) {
  return Math.floor(Math.pow(level, 2) * multiplier + base);
}

/**
 * Calculate the total XP required to reach a specific level (cumulative)
 * 
 * @param {number} level - The level to calculate cumulative XP for
 * @param {number} [multiplier=25] - XP curve multiplier
 * @param {number} [base=100] - Base XP for first level
 * @returns {number} - The total cumulative XP required to reach this level
 */
function calculateTotalRequiredXP(level, multiplier = 25, base = 100) {
  let totalXP = 0;
  
  for (let i = 1; i <= level; i++) {
    totalXP += calculateRequiredXP(i, multiplier, base);
  }
  
  return totalXP;
}

/**
 * Calculate level and remaining XP from total XP
 * 
 * @param {number} totalXP - The total XP accumulated
 * @param {number} [multiplier=25] - XP curve multiplier
 * @param {number} [base=100] - Base XP for first level
 * @returns {Object} - Object containing level, currentXP, and requiredXP for next level
 */
function calculateLevelFromXP(totalXP, multiplier = 25, base = 100) {
  let level = 0;
  let remainingXP = totalXP;
  let requiredXP = 0;
  
  // Incrementally calculate level based on XP thresholds
  while (true) {
    const nextLevelXP = calculateRequiredXP(level + 1, multiplier, base);
    
    if (remainingXP >= nextLevelXP) {
      level++;
      remainingXP -= nextLevelXP;
    } else {
      requiredXP = nextLevelXP;
      break;
    }
  }
  
  return {
    level,
    currentXP: remainingXP,
    requiredXP
  };
}

/**
 * Calculate reward roles that should be assigned based on level
 * 
 * @param {number} level - The current level
 * @param {Array<Object>} levelRoles - Array of level role objects {level, roleId}
 * @returns {Array<string>} - Array of role IDs that should be assigned
 */
function calculateRewardRoles(level, levelRoles) {
  return levelRoles
    .filter(role => role.level <= level)
    .map(role => role.roleId);
}

module.exports = {
  calculateRequiredXP,
  calculateTotalRequiredXP,
  calculateLevelFromXP,
  calculateRewardRoles
};