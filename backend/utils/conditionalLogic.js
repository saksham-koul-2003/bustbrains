/**
 * Pure function to determine if a question should be shown based on conditional rules
 * @param {Object|null} rules - ConditionalRules object or null
 * @param {Object} answersSoFar - Record of questionKey -> answer values
 * @returns {boolean} - true if question should be shown, false otherwise
 */
export function shouldShowQuestion(rules, answersSoFar) {
  // If no rules, always show the question
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const { logic, conditions } = rules;

  // Evaluate each condition
  const conditionResults = conditions.map(condition => {
    const { questionKey, operator, value } = condition;
    const answerValue = answersSoFar[questionKey];

    // If the answer is missing/undefined, condition fails
    if (answerValue === undefined || answerValue === null) {
      return false;
    }

    switch (operator) {
      case 'equals':
        // Handle array comparison for multi-select
        if (Array.isArray(answerValue) && Array.isArray(value)) {
          return JSON.stringify(answerValue.sort()) === JSON.stringify(value.sort());
        }
        return answerValue === value;

      case 'notEquals':
        if (Array.isArray(answerValue) && Array.isArray(value)) {
          return JSON.stringify(answerValue.sort()) !== JSON.stringify(value.sort());
        }
        return answerValue !== value;

      case 'contains':
        // For arrays, check if value is in the array
        if (Array.isArray(answerValue)) {
          return answerValue.includes(value);
        }
        // For strings, check if string contains the value
        if (typeof answerValue === 'string') {
          return answerValue.toLowerCase().includes(String(value).toLowerCase());
        }
        return answerValue === value;

      default:
        return false;
    }
  });

  // Combine results based on logic operator
  if (logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (logic === 'OR') {
    return conditionResults.some(result => result === true);
  }

  return true;
}

