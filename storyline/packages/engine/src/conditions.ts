import type { ComparisonOperator, Condition, ScalarValue } from '@courseweaver/domain';

const coerceNumber = (value: ScalarValue) => {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const evaluateComparison = (
  operator: ComparisonOperator,
  left: ScalarValue | undefined,
  right: ScalarValue | undefined
): boolean => {
  switch (operator) {
    case 'equals':
      return left === right;
    case 'notEquals':
      return left !== right;
    case 'greaterThan': {
      const leftNumber = left === undefined ? undefined : coerceNumber(left);
      const rightNumber = right === undefined ? undefined : coerceNumber(right);
      return leftNumber !== undefined && rightNumber !== undefined && leftNumber > rightNumber;
    }
    case 'lessThan': {
      const leftNumber = left === undefined ? undefined : coerceNumber(left);
      const rightNumber = right === undefined ? undefined : coerceNumber(right);
      return leftNumber !== undefined && rightNumber !== undefined && leftNumber < rightNumber;
    }
    case 'contains':
      return typeof left === 'string' && typeof right === 'string' ? left.includes(right) : false;
    case 'isTrue':
      return left === true;
    case 'isFalse':
      return left === false;
    default:
      return false;
  }
};

export const evaluateConditions = (
  conditions: Condition[],
  variableLookup: Record<string, ScalarValue>
) => conditions.every((condition) => evaluateComparison(condition.operator, variableLookup[condition.variableId], condition.value));