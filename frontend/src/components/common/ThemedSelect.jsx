import { Children, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

function getOptionText(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (isValidElement(child)) return getOptionText(child.props.children)
    return ''
  }).join('')
}

function ThemedSelect({
  children,
  value,
  defaultValue,
  onChange,
  className = '',
  id,
  name,
  disabled = false,
  required = false,
  ...attributes
}) {
  const generatedId = useId()
  const selectId = id || `themed-select-${generatedId}`
  const menuId = `${selectId}-options`
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const optionRefs = useRef([])
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState(null)
  const options = useMemo(() => Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === 'option')
    .map((child) => {
      const label = getOptionText(child.props.children)
      return {
        value: String(child.props.value ?? label),
        label,
        disabled: Boolean(child.props.disabled),
      }
    }), [children])
  const selectedValue = value === undefined ? uncontrolledValue : String(value ?? '')
  const selectedIndex = options.findIndex((option) => option.value === selectedValue)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
  const enabledIndices = options.reduce((indices, option, index) => {
    if (!option.disabled) indices.push(index)
    return indices
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return

      const maxHeight = Math.min(320, window.innerHeight - 24)
      const estimatedHeight = Math.min(options.length * 40 + 42, maxHeight)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
      const width = Math.min(Math.max(rect.width, 190), window.innerWidth - 24)
      const left = Math.min(Math.max(rect.left, 12), window.innerWidth - width - 12)
      const top = placeAbove
        ? Math.max(12, rect.top - estimatedHeight - 8)
        : Math.min(rect.bottom + 8, window.innerHeight - estimatedHeight - 12)

      setPosition({ left, top, width, maxHeight })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return undefined
    const indexToFocus = activeIndex >= 0 && !options[activeIndex]?.disabled
      ? activeIndex
      : enabledIndices[0]
    if (indexToFocus !== undefined) optionRefs.current[indexToFocus]?.focus()

    const closeOnOutsideClick = (event) => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeIndex, enabledIndices, open, options])

  const openMenu = (initialIndex = selectedIndex) => {
    const firstEnabledIndex = enabledIndices[0] ?? 0
    setActiveIndex(initialIndex >= 0 && !options[initialIndex]?.disabled ? initialIndex : firstEnabledIndex)
    setOpen(true)
  }

  const selectOption = (option) => {
    if (disabled || option.disabled) return
    if (value === undefined) setUncontrolledValue(option.value)
    onChange?.({ target: { name, value: option.value }, currentTarget: { name, value: option.value } })
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openMenu(event.key === 'ArrowDown' ? selectedIndex : selectedIndex >= 0 ? selectedIndex : enabledIndices[enabledIndices.length - 1])
        return
      }
      const currentPosition = enabledIndices.indexOf(activeIndex)
      if (!enabledIndices.length) return
      const nextPosition = event.key === 'ArrowDown'
        ? (currentPosition + 1) % enabledIndices.length
        : (currentPosition - 1 + enabledIndices.length) % enabledIndices.length
      setActiveIndex(enabledIndices[nextPosition])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open && options[activeIndex]) selectOption(options[activeIndex])
      else openMenu()
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const handleOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!enabledIndices.length) return
      const currentPosition = enabledIndices.indexOf(index)
      const nextPosition = event.key === 'ArrowDown'
        ? (currentPosition + 1) % enabledIndices.length
        : (currentPosition - 1 + enabledIndices.length) % enabledIndices.length
      setActiveIndex(enabledIndices[nextPosition])
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!enabledIndices.length) return
      setActiveIndex(event.key === 'Home' ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectOption(options[index])
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <>
      <select
        aria-hidden="true"
        tabIndex={-1}
        className="themed-select-native"
        id={`${selectId}-native`}
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        onInvalid={(event) => {
          event.preventDefault()
          openMenu()
          triggerRef.current?.focus()
        }}
        onChange={() => {}}
      >
        {children}
      </select>
      <button
        {...attributes}
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={attributes['aria-label']}
        aria-labelledby={attributes['aria-labelledby']}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleTriggerKeyDown}
        className={`themed-select-trigger inline-flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label || options[0]?.label || 'Select an option'}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={attributes['aria-label'] || 'Options'}
          className="themed-select-menu fixed z-[120] overflow-y-auto rounded-xl border p-1 shadow-[0_10px_28px_rgba(0,0,0,0.2)]"
          style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled || undefined}
              tabIndex={-1}
              data-option-index={index}
              disabled={option.disabled}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onClick={() => selectOption(option)}
              className={`themed-select-option flex min-h-8 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm transition focus-visible:outline-none ${option.value === selectedValue ? 'is-selected' : ''} ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === selectedValue && <Check size={15} aria-hidden="true" className="shrink-0" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

export default ThemedSelect
