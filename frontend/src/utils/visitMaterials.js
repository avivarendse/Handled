export const MAX_MATERIAL_NAME_LENGTH = 150
export const MAX_MATERIAL_UNIT_LENGTH = 30
export const MAX_MATERIAL_QUANTITY = '99999999.99'

const quantityPattern = /^(\d+)(?:\.(\d{1,2}))?$/
const maxQuantityInHundredths = 9999999999n

function characterCount(value) {
  return Array.from(value).length
}

export function validateMaterialDraft(draft) {
  const errors = {}
  const name = typeof draft.name === 'string' ? draft.name.trim() : ''
  const unit = typeof draft.unit === 'string' ? draft.unit.trim() : ''
  const quantity = typeof draft.quantity === 'string' ? draft.quantity.trim() : ''

  if (!name) {
    errors.name = 'Enter a material name.'
  } else if (characterCount(name) > MAX_MATERIAL_NAME_LENGTH) {
    errors.name = `Use ${MAX_MATERIAL_NAME_LENGTH} characters or fewer.`
  }

  if (!unit) {
    errors.unit = 'Enter a unit.'
  } else if (characterCount(unit) > MAX_MATERIAL_UNIT_LENGTH) {
    errors.unit = `Use ${MAX_MATERIAL_UNIT_LENGTH} characters or fewer.`
  }

  if (!quantity) {
    errors.quantity = 'Enter a quantity.'
  } else if (quantity.startsWith('-')) {
    errors.quantity = 'Quantity must be greater than zero.'
  } else {
    const match = quantityPattern.exec(quantity)
    if (!match) {
      errors.quantity =
        'Enter a decimal using digits and no more than two places after the decimal point.'
    } else {
      const integerPart = match[1].replace(/^0+(?=\d)/, '')
      const fractionalPart = (match[2] || '').padEnd(2, '0')
      const quantityInHundredths =
        BigInt(integerPart) * 100n + BigInt(fractionalPart || '0')
      const numericQuantity = Number(quantity)

      if (!Number.isFinite(numericQuantity)) {
        errors.quantity = 'Enter a finite quantity.'
      } else if (quantityInHundredths === 0n) {
        errors.quantity = 'Quantity must be greater than zero.'
      } else if (quantityInHundredths > maxQuantityInHundredths) {
        errors.quantity = `Quantity cannot exceed ${MAX_MATERIAL_QUANTITY}.`
      }
    }
  }

  return {
    errors,
    material:
      Object.keys(errors).length === 0
        ? { name, quantity, unit }
        : null,
  }
}
